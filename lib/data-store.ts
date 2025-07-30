"use client"

// Clean JSON data structure for the banking application
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  ssn: string
  address: string
  city: string
  state: string
  zipCode: string
  password: string
  pin: string
  accountNumber: string
  checkingBalance: number
  savingsBalance: number
  availableCheckingBalance: number // Always 0 until verified
  availableSavingsBalance: number // Always 0 until verified
  accountStatus: "pending" | "verified" | "suspended" | "closed"
  verificationStatus: "pending" | "selfie_required" | "documents_required" | "verified" | "rejected"
  selfieUrl?: string
  licenseUrl?: string
  licenseNumber?: string
  licenseState?: string
  createdAt: string
  lastLogin?: string
  kycCompleted: boolean
}

export interface Transaction {
  id: string
  userId: string
  type: "credit" | "debit"
  amount: number
  description: string
  category: string
  fromAccount: "checking" | "savings"
  toAccount?: string
  status: "pending" | "completed" | "failed"
  date: string
}

export interface AdminUser {
  id: string
  username: string
  password: string
  role: "admin" | "super_admin"
  permissions: string[]
  createdAt: string
}

export interface BankData {
  users: User[]
  transactions: Transaction[]
  admins: AdminUser[]
  settings: {
    requireSelfieVerification: boolean
    minimumAge: number
    maxDailyTransferLimit: number
  }
  version: string
  lastUpdated: string
  metadata: {
    totalLogins: number
    totalSignups: number
    lastBackup: string
  }
}

// Storage keys
const STORAGE_KEYS = {
  BANK_DATA: "securebank_data",
  BACKUP_DATA: "securebank_backup",
  VERSION: "securebank_version",
  METADATA: "securebank_metadata",
}

// Current data version for migration purposes
const CURRENT_VERSION = "1.1.0"

// Initialize default data structure
const defaultBankData: BankData = {
  users: [],
  transactions: [],
  admins: [
    {
      id: "admin-1",
      username: "admin",
      password: "admin123",
      role: "super_admin",
      permissions: ["view_users", "edit_users", "manage_accounts", "view_transactions"],
      createdAt: new Date().toISOString(),
    },
  ],
  settings: {
    requireSelfieVerification: true,
    minimumAge: 18,
    maxDailyTransferLimit: 10000,
  },
  version: CURRENT_VERSION,
  lastUpdated: new Date().toISOString(),
  metadata: {
    totalLogins: 0,
    totalSignups: 0,
    lastBackup: new Date().toISOString(),
  },
}

export class DataStore {
  private static instance: DataStore
  private data: BankData
  private isInitialized = false
  private saveQueue: Promise<void> = Promise.resolve()

  private constructor() {
    this.data = { ...defaultBankData }
    this.initializeStore()
  }

  static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore()
    }
    return DataStore.instance
  }

  private initializeStore(): void {
    if (typeof window === "undefined") {
      this.isInitialized = true
      return
    }

    try {
      this.loadData()
      this.isInitialized = true

      // Set up periodic backup and JSON export
      this.setupPeriodicOperations()

      // Listen for storage events from other tabs
      window.addEventListener("storage", this.handleStorageChange.bind(this))

      // Save data before page unload
      window.addEventListener("beforeunload", () => {
        this.saveDataSync()
        this.exportToJSON()
      })

      console.log("DataStore initialized successfully")
    } catch (error) {
      console.error("Failed to initialize DataStore:", error)
      this.handleStorageError()
    }
  }

  private loadData(): void {
    if (typeof window === "undefined") return

    try {
      // Try to load from localStorage first
      const stored = localStorage.getItem(STORAGE_KEYS.BANK_DATA)

      if (stored) {
        const parsedData = JSON.parse(stored) as BankData

        // Validate data structure
        if (this.validateDataStructure(parsedData)) {
          this.data = parsedData

          // Check if migration is needed
          if (parsedData.version !== CURRENT_VERSION) {
            this.migrateData(parsedData)
          }
        } else {
          console.warn("Invalid data structure, attempting JSON recovery")
          this.loadFromJSONBackup()
        }
      } else {
        // Try to load from JSON backup
        this.loadFromJSONBackup()
      }
    } catch (error) {
      console.error("Error loading data:", error)
      this.handleStorageError()
    }
  }

  private loadFromJSONBackup(): void {
    try {
      // In a real implementation, this would load from a server or file
      // For now, we'll use localStorage as a fallback
      const backup = localStorage.getItem(STORAGE_KEYS.BACKUP_DATA)
      if (backup) {
        const backupData = JSON.parse(backup) as BankData
        if (this.validateDataStructure(backupData)) {
          this.data = backupData
          console.log("Loaded from JSON backup")
          return
        }
      }

      // If no backup exists, use defaults
      this.data = { ...defaultBankData }
      this.saveData()
      console.log("Initialized with default data")
    } catch (error) {
      console.error("Error loading from JSON backup:", error)
      this.data = { ...defaultBankData }
    }
  }

  private validateDataStructure(data: any): boolean {
    return (
      data &&
      typeof data === "object" &&
      Array.isArray(data.users) &&
      Array.isArray(data.transactions) &&
      Array.isArray(data.admins) &&
      data.settings &&
      typeof data.settings === "object" &&
      data.version &&
      data.lastUpdated
    )
  }

  private migrateData(oldData: BankData): void {
    console.log(`Migrating data from version ${oldData.version} to ${CURRENT_VERSION}`)

    // Add migration logic here as needed
    this.data = {
      ...oldData,
      version: CURRENT_VERSION,
      lastUpdated: new Date().toISOString(),
      metadata: oldData.metadata || defaultBankData.metadata,
    }

    this.saveData()
  }

  private async saveData(): Promise<void> {
    // Queue saves to prevent race conditions
    this.saveQueue = this.saveQueue.then(() => this.performSave())
    return this.saveQueue
  }

  private async performSave(): Promise<void> {
    if (typeof window === "undefined" || !this.isInitialized) return

    try {
      this.data.lastUpdated = new Date().toISOString()
      const dataToSave = JSON.stringify(this.data)

      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.BANK_DATA, dataToSave)

      // Create backup
      localStorage.setItem(STORAGE_KEYS.BACKUP_DATA, dataToSave)

      // Save version and metadata
      localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION)
      localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(this.data.metadata))

      // Export to JSON (simulated - in real app would save to server/file)
      await this.exportToJSON()
    } catch (error) {
      console.error("Error saving data:", error)
      this.handleStorageError()
    }
  }

  private saveDataSync(): void {
    if (typeof window === "undefined" || !this.isInitialized) return

    try {
      this.data.lastUpdated = new Date().toISOString()
      const dataToSave = JSON.stringify(this.data)

      localStorage.setItem(STORAGE_KEYS.BANK_DATA, dataToSave)
      localStorage.setItem(STORAGE_KEYS.BACKUP_DATA, dataToSave)
    } catch (error) {
      console.error("Error saving data synchronously:", error)
    }
  }

  private async exportToJSON(): Promise<void> {
    try {
      // In a real implementation, this would save to a server or file system
      // For demo purposes, we'll save to a downloadable blob URL
      const jsonData = JSON.stringify(this.data, null, 2)
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)

      // Store the blob URL for potential download
      sessionStorage.setItem("data_export_url", url)

      this.data.metadata.lastBackup = new Date().toISOString()
      console.log("Data exported to JSON successfully")
    } catch (error) {
      console.error("Error exporting to JSON:", error)
    }
  }

  private handleStorageError(): void {
    console.warn("Storage error detected, attempting recovery...")

    try {
      // Try to load backup
      const backup = localStorage.getItem(STORAGE_KEYS.BACKUP_DATA)
      if (backup) {
        const backupData = JSON.parse(backup) as BankData
        if (this.validateDataStructure(backupData)) {
          this.data = backupData
          console.log("Successfully recovered from backup")
          return
        }
      }
    } catch (error) {
      console.error("Backup recovery failed:", error)
    }

    // If all else fails, use defaults
    this.data = { ...defaultBankData }
    console.log("Using default data due to storage errors")
  }

  private handleStorageChange(event: StorageEvent): void {
    if (event.key === STORAGE_KEYS.BANK_DATA && event.newValue) {
      try {
        const newData = JSON.parse(event.newValue) as BankData
        if (this.validateDataStructure(newData)) {
          this.data = newData
          console.log("Data synchronized from another tab")
        }
      } catch (error) {
        console.error("Error synchronizing data from another tab:", error)
      }
    }
  }

  private setupPeriodicOperations(): void {
    // Create backup every 2 minutes
    setInterval(
      () => {
        try {
          this.saveDataSync()
          this.exportToJSON()
        } catch (error) {
          console.error("Periodic operations failed:", error)
        }
      },
      2 * 60 * 1000,
    ) // 2 minutes
  }

  // Authentication methods with enhanced tracking
  async authenticateUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const user = this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase())

      if (!user) {
        return { success: false, error: "No account found with this email address" }
      }

      if (user.password !== password) {
        return { success: false, error: "Incorrect password. Please try again." }
      }

      if (user.accountStatus === "suspended") {
        return { success: false, error: "Your account has been suspended. Please contact support." }
      }

      if (user.accountStatus === "closed") {
        return { success: false, error: "Your account has been closed. Please contact support." }
      }

      // Update login metadata
      this.data.metadata.totalLogins++
      await this.saveData()

      return { success: true, user }
    } catch (error) {
      console.error("Authentication error:", error)
      return { success: false, error: "An unexpected error occurred. Please try again." }
    }
  }

  async validatePin(userId: string, pin: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.data.users.find((u) => u.id === userId)

      if (!user) {
        return { success: false, error: "User not found" }
      }

      if (user.pin !== pin) {
        return { success: false, error: "Incorrect PIN. Please try again." }
      }

      // Update last login
      user.lastLogin = new Date().toISOString()
      await this.saveData()

      return { success: true }
    } catch (error) {
      console.error("PIN validation error:", error)
      return { success: false, error: "An unexpected error occurred. Please try again." }
    }
  }

  // Enhanced user creation with better error handling
  async createUser(
    userData: Omit<
      User,
      | "id"
      | "createdAt"
      | "accountStatus"
      | "verificationStatus"
      | "kycCompleted"
      | "availableCheckingBalance"
      | "availableSavingsBalance"
    >,
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Check if user already exists
      const existingUser = this.data.users.find((u) => u.email.toLowerCase() === userData.email.toLowerCase())
      if (existingUser) {
        return { success: false, error: "An account with this email address already exists" }
      }

      // Validate required fields
      if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
        return { success: false, error: "Please fill in all required fields" }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(userData.email)) {
        return { success: false, error: "Please enter a valid email address" }
      }

      // Validate password strength
      if (userData.password.length < 6) {
        return { success: false, error: "Password must be at least 6 characters long" }
      }

      // Validate PIN
      if (!/^\d{4}$/.test(userData.pin)) {
        return { success: false, error: "PIN must be exactly 4 digits" }
      }

      const user: User = {
        ...userData,
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        accountStatus: "pending",
        verificationStatus: "documents_required",
        kycCompleted: false,
        availableCheckingBalance: 0,
        availableSavingsBalance: 0,
        createdAt: new Date().toISOString(),
      }

      this.data.users.push(user)
      this.data.metadata.totalSignups++
      await this.saveData()

      console.log(`User created: ${user.email}`)
      return { success: true, user }
    } catch (error) {
      console.error("Error creating user:", error)
      return { success: false, error: "Failed to create account. Please try again." }
    }
  }

  // Rest of the existing methods remain the same but with async/await pattern
  getUserByEmail(email: string): User | undefined {
    try {
      return this.data.users.find((user) => user.email.toLowerCase() === email.toLowerCase())
    } catch (error) {
      console.error("Error getting user by email:", error)
      return undefined
    }
  }

  getUserById(id: string): User | undefined {
    try {
      return this.data.users.find((user) => user.id === id)
    } catch (error) {
      console.error("Error getting user by ID:", error)
      return undefined
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      const userIndex = this.data.users.findIndex((user) => user.id === id)
      if (userIndex !== -1) {
        this.data.users[userIndex] = { ...this.data.users[userIndex], ...updates }
        await this.saveData()

        console.log(`User updated: ${id}`)
        return this.data.users[userIndex]
      }
      return undefined
    } catch (error) {
      console.error("Error updating user:", error)
      return undefined
    }
  }

  getAllUsers(): User[] {
    try {
      return [...this.data.users]
    } catch (error) {
      console.error("Error getting all users:", error)
      return []
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const userIndex = this.data.users.findIndex((user) => user.id === id)
      if (userIndex !== -1) {
        this.data.users.splice(userIndex, 1)
        this.data.transactions = this.data.transactions.filter((txn) => txn.userId !== id)
        await this.saveData()

        console.log(`User deleted: ${id}`)
        return true
      }
      return false
    } catch (error) {
      console.error("Error deleting user:", error)
      return false
    }
  }

  getAdminByUsername(username: string): AdminUser | undefined {
    try {
      return this.data.admins.find((admin) => admin.username.toLowerCase() === username.toLowerCase())
    } catch (error) {
      console.error("Error getting admin by username:", error)
      return undefined
    }
  }

  async createTransaction(transactionData: Omit<Transaction, "id" | "date" | "status">): Promise<Transaction> {
    try {
      const transaction: Transaction = {
        ...transactionData,
        id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: "completed",
        date: new Date().toISOString(),
      }

      this.data.transactions.push(transaction)
      await this.saveData()

      console.log(`Transaction created: ${transaction.id}`)
      return transaction
    } catch (error) {
      console.error("Error creating transaction:", error)
      throw new Error("Failed to create transaction")
    }
  }

  getTransactionsByUserId(userId: string): Transaction[] {
    try {
      return this.data.transactions.filter((txn) => txn.userId === userId)
    } catch (error) {
      console.error("Error getting transactions by user ID:", error)
      return []
    }
  }

  getAllTransactions(): Transaction[] {
    try {
      return [...this.data.transactions]
    } catch (error) {
      console.error("Error getting all transactions:", error)
      return []
    }
  }

  getSettings() {
    try {
      return { ...this.data.settings }
    } catch (error) {
      console.error("Error getting settings:", error)
      return defaultBankData.settings
    }
  }

  async updateSettings(settings: Partial<BankData["settings"]>): Promise<void> {
    try {
      this.data.settings = { ...this.data.settings, ...settings }
      await this.saveData()
      console.log("Settings updated")
    } catch (error) {
      console.error("Error updating settings:", error)
    }
  }

  exportData(): string {
    try {
      return JSON.stringify(this.data, null, 2)
    } catch (error) {
      console.error("Error exporting data:", error)
      return "{}"
    }
  }

  async importData(jsonData: string): Promise<boolean> {
    try {
      const importedData = JSON.parse(jsonData) as BankData

      if (this.validateDataStructure(importedData)) {
        this.data = importedData
        await this.saveData()
        console.log("Data imported successfully")
        return true
      } else {
        console.error("Invalid data structure for import")
        return false
      }
    } catch (error) {
      console.error("Error importing data:", error)
      return false
    }
  }

  async clearAllData(): Promise<void> {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEYS.BANK_DATA)
        localStorage.removeItem(STORAGE_KEYS.BACKUP_DATA)
        localStorage.removeItem(STORAGE_KEYS.VERSION)
        localStorage.removeItem(STORAGE_KEYS.METADATA)
      }

      this.data = { ...defaultBankData }
      await this.saveData()

      console.log("All data cleared")
    } catch (error) {
      console.error("Error clearing data:", error)
    }
  }

  getDataStats() {
    try {
      return {
        totalUsers: this.data.users.length,
        totalTransactions: this.data.transactions.length,
        totalAdmins: this.data.admins.length,
        totalLogins: this.data.metadata.totalLogins,
        totalSignups: this.data.metadata.totalSignups,
        version: this.data.version,
        lastUpdated: this.data.lastUpdated,
        lastBackup: this.data.metadata.lastBackup,
        storageSize: typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.BANK_DATA)?.length || 0 : 0,
      }
    } catch (error) {
      console.error("Error getting data stats:", error)
      return {
        totalUsers: 0,
        totalTransactions: 0,
        totalAdmins: 0,
        totalLogins: 0,
        totalSignups: 0,
        version: CURRENT_VERSION,
        lastUpdated: new Date().toISOString(),
        lastBackup: new Date().toISOString(),
        storageSize: 0,
      }
    }
  }
}
