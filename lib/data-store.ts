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
  accountStatus: "pending" | "verified" | "suspended" | "closed" | "locked" // Added 'locked'
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

export interface Bill {
  id: string
  userId: string // Added userId to link bills to users
  company: string
  category: string
  amount: number
  dueDate: string
  status: "paid" | "pending" | "overdue"
  // icon: any; // Icons are not serializable in JSON, will handle in component
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
  bills: Bill[] // Added bills to BankData
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

// Initialize default data structure without dummy users, transactions, or bills
const defaultBankData: BankData = {
  users: [],
  transactions: [],
  bills: [],
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
    console.log("DataStore: Constructor called.")
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
      console.log("DataStore: Running in SSR, skipping localStorage initialization.")
      this.isInitialized = true
      return
    }
    if (this.isInitialized) {
      console.log("DataStore: Already initialized, skipping.")
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
        console.log("DataStore: beforeunload event - saving data synchronously.")
        this.saveDataSync()
        this.exportToJSON()
      })
      console.log("DataStore: Initialization complete.")
    } catch (error) {
      console.error("DataStore: Failed to initialize DataStore:", error)
      this.handleStorageError()
    }
  }

  private loadData(): void {
    if (typeof window === "undefined") return
    console.log("DataStore: Attempting to load data from localStorage.")
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BANK_DATA)
      if (stored) {
        const parsedData = JSON.parse(stored) as BankData
        if (this.validateDataStructure(parsedData)) {
          this.data = parsedData
          console.log("DataStore: Loaded data from localStorage. Current users:", this.data.users.length)
          if (parsedData.version !== CURRENT_VERSION) {
            this.migrateData(parsedData)
          }
        } else {
          console.warn("DataStore: Invalid data structure in localStorage, attempting JSON recovery.")
          this.loadFromJSONBackup()
        }
      } else {
        console.log("DataStore: No data found in localStorage, attempting JSON backup.")
        this.loadFromJSONBackup()
      }
    } catch (error) {
      console.error("DataStore: Error loading data from localStorage:", error)
      this.handleStorageError()
      // Fallback to default if loading fails
      this.data = { ...defaultBankData }
      this.saveData() // Immediately save defaults to establish a clean state
      console.log("DataStore: Fallback to default data due to load error.")
    }
  }

  private loadFromJSONBackup(): void {
    console.log("DataStore: Attempting to load from JSON backup.")
    try {
      const backup = localStorage.getItem(STORAGE_KEYS.BACKUP_DATA)
      if (backup) {
        const backupData = JSON.parse(backup) as BankData
        if (this.validateDataStructure(backupData)) {
          this.data = backupData
          console.log("DataStore: Loaded from JSON backup. Current users:", this.data.users.length)
          return
        }
      }
      console.log("DataStore: No valid JSON backup found. Initializing with default data.")
      this.data = { ...defaultBankData }
      this.saveData() // Immediately save defaults to establish a clean state
    } catch (error) {
      console.error("DataStore: Error loading from JSON backup:", error)
      this.data = { ...defaultBankData }
      this.saveData() // Immediately save defaults to establish a clean state
      console.log("DataStore: Fallback to default data due to backup load error.")
    }
  }

  private validateDataStructure(data: any): boolean {
    const isValid =
      data &&
      typeof data === "object" &&
      Array.isArray(data.users) &&
      Array.isArray(data.transactions) &&
      Array.isArray(data.bills) &&
      Array.isArray(data.admins) &&
      data.settings &&
      typeof data.settings === "object" &&
      data.version &&
      data.lastUpdated
    console.log("DataStore: Data structure validation result:", isValid)
    return isValid
  }

  private migrateData(oldData: BankData): void {
    console.log(`DataStore: Migrating data from version ${oldData.version} to ${CURRENT_VERSION}`)
    this.data = {
      ...oldData,
      version: CURRENT_VERSION,
      lastUpdated: new Date().toISOString(),
      metadata: oldData.metadata || defaultBankData.metadata,
      bills: oldData.bills || [],
    }
    this.saveData()
    console.log("DataStore: Data migration complete.")
  }

  private async saveData(): Promise<void> {
    console.log("DataStore: Queuing save operation.")
    this.saveQueue = this.saveQueue.then(() => this.performSave())
    return this.saveQueue
  }

  private async performSave(): Promise<void> {
    if (typeof window === "undefined" || !this.isInitialized) {
      console.log("DataStore: Skipping save - not in browser or not initialized.")
      return
    }
    try {
      this.data.lastUpdated = new Date().toISOString()
      const dataToSave = JSON.stringify(this.data)
      localStorage.setItem(STORAGE_KEYS.BANK_DATA, dataToSave)
      localStorage.setItem(STORAGE_KEYS.BACKUP_DATA, dataToSave)
      localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION)
      localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(this.data.metadata))
      await this.exportToJSON()
      console.log("DataStore: Data saved successfully. Current users:", this.data.users.length)
    } catch (error) {
      console.error("DataStore: Error saving data:", error)
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
      console.log("DataStore: Data saved synchronously.")
    } catch (error) {
      console.error("DataStore: Error saving data synchronously:", error)
    }
  }

  private async exportToJSON(): Promise<void> {
    try {
      const jsonData = JSON.stringify(this.data, null, 2)
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      sessionStorage.setItem("data_export_url", url)
      this.data.metadata.lastBackup = new Date().toISOString()
      console.log("DataStore: Data exported to JSON successfully.")
    } catch (error) {
      console.error("DataStore: Error exporting to JSON:", error)
    }
  }

  private handleStorageChange(event: StorageEvent): void {
    if (event.key === STORAGE_KEYS.BANK_DATA && event.newValue) {
      try {
        const newData = JSON.parse(event.newValue) as BankData
        if (this.validateDataStructure(newData)) {
          this.data = newData
          console.log("DataStore: Data synchronized from another tab. Current users:", this.data.users.length)
        }
      } catch (error) {
        console.error("DataStore: Error synchronizing data from another tab:", error)
      }
    }
  }

  private setupPeriodicOperations(): void {
    setInterval(
      () => {
        try {
          console.log("DataStore: Performing periodic save and export.")
          this.saveDataSync()
          this.exportToJSON()
        } catch (error) {
          console.error("DataStore: Periodic operations failed:", error)
        }
      },
      2 * 60 * 1000,
    ) // 2 minutes
  }

  private handleStorageError(): void {
    console.error("DataStore: A storage error occurred. This might indicate localStorage issues.")
    // In a production app, you might want to notify the user or switch to a different storage mechanism.
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
      if (user.accountStatus === "locked") {
        return { success: false, error: "Your account has been locked. Please contact support." }
      }
      this.data.metadata.totalLogins++
      await this.saveData()
      return { success: true, user }
    } catch (error) {
      console.error("DataStore: Authentication error:", error)
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
      user.lastLogin = new Date().toISOString()
      await this.saveData()
      return { success: true }
    } catch (error) {
      console.error("DataStore: PIN validation error:", error)
      return { success: false, error: "An unexpected error occurred. Please try again." }
    }
  }

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
      const existingUser = this.data.users.find((u) => u.email.toLowerCase() === userData.email.toLowerCase())
      if (existingUser) {
        return { success: false, error: "An account with this email address already exists" }
      }
      if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
        return { success: false, error: "Please fill in all required fields" }
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(userData.email)) {
        return { success: false, error: "Please enter a valid email address" }
      }
      if (userData.password.length < 6) {
        return { success: false, error: "Password must be at least 6 characters long" }
      }
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
      console.log(`DataStore: User created: ${user.email}`)
      return { success: true, user }
    } catch (error) {
      console.error("DataStore: Error creating user:", error)
      return { success: false, error: "Failed to create account. Please try again." }
    }
  }

  getUserByEmail(email: string): User | undefined {
    try {
      return this.data.users.find((user) => user.email.toLowerCase() === email.toLowerCase())
    } catch (error) {
      console.error("DataStore: Error getting user by email:", error)
      return undefined
    }
  }

  getUserById(id: string): User | undefined {
    try {
      return this.data.users.find((user) => user.id === id)
    } catch (error) {
      console.error("DataStore: Error getting user by ID:", error)
      return undefined
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      const userIndex = this.data.users.findIndex((user) => user.id === id)
      if (userIndex !== -1) {
        this.data.users[userIndex] = { ...this.data.users[userIndex], ...updates }
        await this.saveData()
        console.log(`DataStore: User updated: ${id}`)
        return this.data.users[userIndex]
      }
      return undefined
    } catch (error) {
      console.error("DataStore: Error updating user:", error)
      return undefined
    }
  }

  getAllUsers(): User[] {
    try {
      const users = [...this.data.users]
      console.log("DataStore: getAllUsers called. Returning", users.length, "users.")
      return users
    } catch (error) {
      console.error("DataStore: Error getting all users:", error)
      return []
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const userIndex = this.data.users.findIndex((user) => user.id === id)
      if (userIndex !== -1) {
        this.data.users.splice(userIndex, 1)
        this.data.transactions = this.data.transactions.filter((txn) => txn.userId !== id)
        this.data.bills = this.data.bills.filter((bill) => bill.userId !== id)
        await this.saveData()
        console.log(`DataStore: User deleted: ${id}`)
        return true
      }
      return false
    } catch (error) {
      console.error("DataStore: Error deleting user:", error)
      return false
    }
  }

  getAdminByUsername(username: string): AdminUser | undefined {
    try {
      return this.data.admins.find((admin) => admin.username.toLowerCase() === username.toLowerCase())
    } catch (error) {
      console.error("DataStore: Error getting admin by username:", error)
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
      console.log(`DataStore: Transaction created: ${transaction.id}`)
      return transaction
    } catch (error) {
      console.error("DataStore: Error creating transaction:", error)
      throw new Error("Failed to create transaction")
    }
  }

  getTransactionsByUserId(userId: string): Transaction[] {
    try {
      return this.data.transactions.filter((txn) => txn.userId === userId)
    } catch (error) {
      console.error("DataStore: Error getting transactions by user ID:", error)
      return []
    }
  }

  getAllTransactions(): Transaction[] {
    try {
      const transactions = [...this.data.transactions]
      console.log("DataStore: getAllTransactions called. Returning", transactions.length, "transactions.")
      return transactions
    } catch (error) {
      console.error("DataStore: Error getting all transactions:", error)
      return []
    }
  }

  async createBill(billData: Omit<Bill, "id" | "status">): Promise<Bill> {
    try {
      const bill: Bill = {
        ...billData,
        id: `bill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: "pending",
      }
      this.data.bills.push(bill)
      await this.saveData()
      console.log(`DataStore: Bill created: ${bill.id} for user ${bill.userId}`)
      return bill
    } catch (error) {
      console.error("DataStore: Error creating bill:", error)
      throw new Error("Failed to create bill")
    }
  }

  getBillsByUserId(userId: string): Bill[] {
    try {
      return this.data.bills.filter((bill) => bill.userId === userId)
    } catch (error) {
      console.error("DataStore: Error getting bills by user ID:", error)
      return []
    }
  }

  async updateBill(billId: string, updates: Partial<Bill>): Promise<Bill | undefined> {
    try {
      const billIndex = this.data.bills.findIndex((bill) => bill.id === billId)
      if (billIndex !== -1) {
        this.data.bills[billIndex] = { ...this.data.bills[billIndex], ...updates }
        await this.saveData()
        console.log(`DataStore: Bill updated: ${billId}`)
        return this.data.bills[billIndex]
      }
      return undefined
    } catch (error) {
      console.error("DataStore: Error updating bill:", error)
      return undefined
    }
  }

  getSettings() {
    try {
      return { ...this.data.settings }
    } catch (error) {
      console.error("DataStore: Error getting settings:", error)
      return defaultBankData.settings
    }
  }

  async updateSettings(settings: Partial<BankData["settings"]>): Promise<void> {
    try {
      this.data.settings = { ...this.data.settings, ...settings }
      await this.saveData()
      console.log("DataStore: Settings updated")
    } catch (error) {
      console.error("DataStore: Error updating settings:", error)
    }
  }

  exportData(): string {
    try {
      return JSON.stringify(this.data, null, 2)
    } catch (error) {
      console.error("DataStore: Error exporting data:", error)
      return "{}"
    }
  }

  async importData(jsonData: string): Promise<boolean> {
    try {
      const importedData = JSON.parse(jsonData) as BankData
      if (this.validateDataStructure(importedData)) {
        this.data = importedData
        await this.saveData()
        console.log("DataStore: Data imported successfully")
        return true
      } else {
        console.error("DataStore: Invalid data structure for import")
        return false
      }
    } catch (error) {
      console.error("DataStore: Error importing data:", error)
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
      console.log("DataStore: All data cleared.")
    } catch (error) {
      console.error("DataStore: Error clearing data:", error)
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
      console.error("DataStore: Error getting data stats:", error)
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
