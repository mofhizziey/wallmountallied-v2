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
  availableCheckingBalance: number
  availableSavingsBalance: number
  accountStatus: "pending" | "verified" | "suspended" | "locked" | "closed"
  verificationStatus: "pending" | "selfie_required" | "documents_required" | "verified" | "rejected"
  selfieUrl?: string
  licenseUrl?: string
  licenseNumber?: string
  licenseState?: string
  createdAt: string
  lastLogin?: string
  kycCompleted: boolean
  lockReason?: string
  suspensionReason?: string
  loginAttempts: number
  lastLoginAttempt?: string
  profilePicture?: string
  occupation?: string
  monthlyIncome?: number
  creditScore?: number
  accountLimits: {
    dailyTransferLimit: number
    monthlyTransferLimit: number
    dailyWithdrawalLimit: number
  }
  preferences: {
    notifications: boolean
    emailUpdates: boolean
    twoFactorAuth: boolean
  }
  securityQuestions?: {
    question1: string
    answer1: string
    question2: string
    answer2: string
  }
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
  status: "pending" | "completed" | "failed" | "cancelled"
  date: string
  fee?: number
  balanceAfter?: number
  location?: string
  merchantCategory?: string
}

export interface Bill {
  id: string
  userId: string
  payeeName: string
  payeeType: "utility" | "credit_card" | "loan" | "subscription" | "other"
  accountNumber: string
  amount: number
  dueDate: string
  isPaid: boolean
  isRecurring: boolean
  frequency?: "monthly" | "quarterly" | "annually"
  category: string
  autopay: boolean
  createdAt: string
  lastPaid?: string
  notes?: string
}

export interface AdminUser {
  id: string
  username: string
  password: string
  role: "admin" | "super_admin"
  permissions: string[]
  createdAt: string
  lastLogin?: string
  loginAttempts: number
}

export interface BankData {
  users: User[]
  transactions: Transaction[]
  bills: Bill[]
  admins: AdminUser[]
  settings: {
    requireSelfieVerification: boolean
    minimumAge: number
    maxDailyTransferLimit: number
    maxLoginAttempts: number
    accountLockoutDuration: number
    maintenanceMode: boolean
  }
  version: string
  lastUpdated: string
  metadata: {
    totalLogins: number
    totalSignups: number
    lastBackup: string
    totalTransactionVolume: number
    averageAccountBalance: number
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
const CURRENT_VERSION = "2.0.0"

// Initialize default data structure
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
      permissions: ["view_users", "edit_users", "manage_accounts", "view_transactions", "system_admin"],
      createdAt: new Date().toISOString(),
      loginAttempts: 0,
    },
  ],
  settings: {
    requireSelfieVerification: true,
    minimumAge: 18,
    maxDailyTransferLimit: 10000,
    maxLoginAttempts: 5,
    accountLockoutDuration: 30, // minutes
    maintenanceMode: false,
  },
  version: CURRENT_VERSION,
  lastUpdated: new Date().toISOString(),
  metadata: {
    totalLogins: 0,
    totalSignups: 0,
    lastBackup: new Date().toISOString(),
    totalTransactionVolume: 0,
    averageAccountBalance: 0,
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
      this.setupPeriodicOperations()

      window.addEventListener("storage", this.handleStorageChange.bind(this))
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
      const stored = localStorage.getItem(STORAGE_KEYS.BANK_DATA)

      if (stored) {
        const parsedData = JSON.parse(stored) as BankData

        if (this.validateDataStructure(parsedData)) {
          this.data = parsedData

          if (parsedData.version !== CURRENT_VERSION) {
            this.migrateData(parsedData)
          }
        } else {
          console.warn("Invalid data structure, attempting JSON recovery")
          this.loadFromJSONBackup()
        }
      } else {
        this.loadFromJSONBackup()
      }
    } catch (error) {
      console.error("Error loading data:", error)
      this.handleStorageError()
    }
  }

  private loadFromJSONBackup(): void {
    try {
      const backup = localStorage.getItem(STORAGE_KEYS.BACKUP_DATA)
      if (backup) {
        const backupData = JSON.parse(backup) as BankData
        if (this.validateDataStructure(backupData)) {
          this.data = backupData
          console.log("Loaded from JSON backup")
          return
        }
      }

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

    // Migration logic for new fields
    const migratedUsers = oldData.users.map((user) => ({
      ...user,
      lockReason: user.lockReason || undefined,
      suspensionReason: user.suspensionReason || undefined,
      loginAttempts: user.loginAttempts || 0,
      occupation: user.occupation || undefined,
      monthlyIncome: user.monthlyIncome || undefined,
      creditScore: user.creditScore || undefined,
      accountLimits: user.accountLimits || {
        dailyTransferLimit: 5000,
        monthlyTransferLimit: 50000,
        dailyWithdrawalLimit: 1000,
      },
      preferences: user.preferences || {
        notifications: true,
        emailUpdates: true,
        twoFactorAuth: false,
      },
    }))

    this.data = {
      ...oldData,
      users: migratedUsers,
      bills: oldData.bills || [],
      version: CURRENT_VERSION,
      lastUpdated: new Date().toISOString(),
      metadata: {
        ...defaultBankData.metadata,
        ...oldData.metadata,
      },
      settings: {
        ...defaultBankData.settings,
        ...oldData.settings,
      },
    }

    this.saveData()
  }

  private async saveData(): Promise<void> {
    this.saveQueue = this.saveQueue.then(() => this.performSave())
    return this.saveQueue
  }

  private async performSave(): Promise<void> {
    if (typeof window === "undefined" || !this.isInitialized) return

    try {
      this.data.lastUpdated = new Date().toISOString()
      const dataToSave = JSON.stringify(this.data)

      localStorage.setItem(STORAGE_KEYS.BANK_DATA, dataToSave)
      localStorage.setItem(STORAGE_KEYS.BACKUP_DATA, dataToSave)
      localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION)
      localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(this.data.metadata))

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
      const jsonData = JSON.stringify(this.data, null, 2)
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)

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
    setInterval(
      () => {
        try {
          this.saveDataSync()
          this.exportToJSON()
          this.updateMetadata()
        } catch (error) {
          console.error("Periodic operations failed:", error)
        }
      },
      2 * 60 * 1000,
    )
  }

  private updateMetadata(): void {
    const totalVolume = this.data.transactions.reduce((sum, txn) => sum + txn.amount, 0)
    const totalBalance = this.data.users.reduce((sum, user) => sum + user.checkingBalance + user.savingsBalance, 0)
    const avgBalance = this.data.users.length > 0 ? totalBalance / this.data.users.length : 0

    this.data.metadata.totalTransactionVolume = totalVolume
    this.data.metadata.averageAccountBalance = avgBalance
  }

  // Enhanced authentication with account status checks
  async authenticateUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      if (this.data.settings.maintenanceMode) {
        return { success: false, error: "System is currently under maintenance. Please try again later." }
      }

      const user = this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase())

      if (!user) {
        return { success: false, error: "No account found with this email address" }
      }

      // Check if account is locked
      if (user.accountStatus === "locked") {
        return {
          success: false,
          error: `Your account has been locked. ${user.lockReason || "Please contact support for assistance."}`,
        }
      }

      // Check if account is suspended
      if (user.accountStatus === "suspended") {
        return {
          success: false,
          error: `Your account has been suspended. ${user.suspensionReason || "Please contact support for assistance."}`,
        }
      }

      // Check if account is closed
      if (user.accountStatus === "closed") {
        return { success: false, error: "Your account has been closed. Please contact support." }
      }

      // Check login attempts
      if (user.loginAttempts >= this.data.settings.maxLoginAttempts) {
        const lockUser = await this.lockUserAccount(user.id, "Too many failed login attempts")
        if (lockUser) {
          return {
            success: false,
            error: "Account locked due to too many failed login attempts. Please contact support.",
          }
        }
      }

      if (user.password !== password) {
        // Increment login attempts
        await this.updateUser(user.id, {
          loginAttempts: user.loginAttempts + 1,
          lastLoginAttempt: new Date().toISOString(),
        })
        return { success: false, error: "Incorrect password. Please try again." }
      }

      // Reset login attempts on successful authentication
      await this.updateUser(user.id, {
        loginAttempts: 0,
        lastLoginAttempt: new Date().toISOString(),
      })

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

      // Double-check account status
      if (["locked", "suspended", "closed"].includes(user.accountStatus)) {
        return { success: false, error: "Account access restricted" }
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

  // Enhanced user creation
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
      | "loginAttempts"
      | "accountLimits"
      | "preferences"
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
        loginAttempts: 0,
        accountLimits: {
          dailyTransferLimit: 5000,
          monthlyTransferLimit: 50000,
          dailyWithdrawalLimit: 1000,
        },
        preferences: {
          notifications: true,
          emailUpdates: true,
          twoFactorAuth: false,
        },
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

  // Account management methods
  async lockUserAccount(userId: string, reason: string): Promise<User | undefined> {
    const user = await this.updateUser(userId, {
      accountStatus: "locked",
      lockReason: reason,
    })
    return user
  }

  async unlockUserAccount(userId: string): Promise<User | undefined> {
    const user = await this.updateUser(userId, {
      accountStatus: "verified",
      lockReason: undefined,
      loginAttempts: 0,
    })
    return user
  }

  async suspendUserAccount(userId: string, reason: string): Promise<User | undefined> {
    const user = await this.updateUser(userId, {
      accountStatus: "suspended",
      suspensionReason: reason,
    })
    return user
  }

  async closeUserAccount(userId: string): Promise<User | undefined> {
    const user = await this.updateUser(userId, {
      accountStatus: "closed",
    })
    return user
  }

  // Enhanced user filtering and search
  searchUsers(
    query: string,
    filters: {
      status?: string
      verification?: string
      balanceRange?: { min: number; max: number }
      dateRange?: { start: string; end: string }
      hasTransactions?: boolean
    } = {},
  ): User[] {
    let users = [...this.data.users]

    // Text search
    if (query) {
      const lowerQuery = query.toLowerCase()
      users = users.filter(
        (user) =>
          user.firstName.toLowerCase().includes(lowerQuery) ||
          user.lastName.toLowerCase().includes(lowerQuery) ||
          user.email.toLowerCase().includes(lowerQuery) ||
          user.accountNumber.includes(query) ||
          user.phone.includes(query),
      )
    }

    // Status filter
    if (filters.status && filters.status !== "all") {
      users = users.filter((user) => user.accountStatus === filters.status)
    }

    // Verification filter
    if (filters.verification && filters.verification !== "all") {
      users = users.filter((user) => user.verificationStatus === filters.verification)
    }

    // Balance range filter
    if (filters.balanceRange) {
      users = users.filter((user) => {
        const totalBalance = user.checkingBalance + user.savingsBalance
        return totalBalance >= filters.balanceRange!.min && totalBalance <= filters.balanceRange!.max
      })
    }

    // Date range filter
    if (filters.dateRange) {
      users = users.filter((user) => {
        const createdDate = new Date(user.createdAt)
        const startDate = new Date(filters.dateRange!.start)
        const endDate = new Date(filters.dateRange!.end)
        return createdDate >= startDate && createdDate <= endDate
      })
    }

    // Has transactions filter
    if (filters.hasTransactions !== undefined) {
      const userTransactions = this.data.transactions
      users = users.filter((user) => {
        const hasTransactions = userTransactions.some((txn) => txn.userId === user.id)
        return filters.hasTransactions ? hasTransactions : !hasTransactions
      })
    }

    return users
  }

  // Bill management
  async createBill(billData: Omit<Bill, "id" | "createdAt">): Promise<Bill> {
    const bill: Bill = {
      ...billData,
      id: `bill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }

    this.data.bills.push(bill)
    await this.saveData()
    return bill
  }

  async updateBill(billId: string, updates: Partial<Bill>): Promise<Bill | undefined> {
    const billIndex = this.data.bills.findIndex((bill) => bill.id === billId)
    if (billIndex !== -1) {
      this.data.bills[billIndex] = { ...this.data.bills[billIndex], ...updates }
      await this.saveData()
      return this.data.bills[billIndex]
    }
    return undefined
  }

  async deleteBill(billId: string): Promise<boolean> {
    const billIndex = this.data.bills.findIndex((bill) => bill.id === billId)
    if (billIndex !== -1) {
      this.data.bills.splice(billIndex, 1)
      await this.saveData()
      return true
    }
    return false
  }

  getBillsByUserId(userId: string): Bill[] {
    return this.data.bills.filter((bill) => bill.userId === userId)
  }

  getAllBills(): Bill[] {
    return [...this.data.bills]
  }

  // Enhanced transaction methods
  async createTransaction(transactionData: Omit<Transaction, "id" | "date" | "status">): Promise<Transaction> {
    try {
      const user = this.getUserById(transactionData.userId)
      const balanceAfter = user
        ? transactionData.fromAccount === "checking"
          ? user.checkingBalance
          : user.savingsBalance
        : 0

      const transaction: Transaction = {
        ...transactionData,
        id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: "completed",
        date: new Date().toISOString(),
        balanceAfter,
        location: "Online Banking",
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

  getTransactionsByUserId(
    userId: string,
    filters?: {
      type?: "credit" | "debit"
      category?: string
      dateRange?: { start: string; end: string }
      amountRange?: { min: number; max: number }
    },
  ): Transaction[] {
    let transactions = this.data.transactions.filter((txn) => txn.userId === userId)

    if (filters) {
      if (filters.type) {
        transactions = transactions.filter((txn) => txn.type === filters.type)
      }
      if (filters.category) {
        transactions = transactions.filter((txn) => txn.category === filters.category)
      }
      if (filters.dateRange) {
        transactions = transactions.filter((txn) => {
          const txnDate = new Date(txn.date)
          const startDate = new Date(filters.dateRange!.start)
          const endDate = new Date(filters.dateRange!.end)
          return txnDate >= startDate && txnDate <= endDate
        })
      }
      if (filters.amountRange) {
        transactions = transactions.filter(
          (txn) => txn.amount >= filters.amountRange!.min && txn.amount <= filters.amountRange!.max,
        )
      }
    }

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // Analytics methods
  getUserAnalytics(userId: string) {
    const user = this.getUserById(userId)
    if (!user) return null

    const transactions = this.getTransactionsByUserId(userId)
    const bills = this.getBillsByUserId(userId)

    const monthlySpending = transactions.filter((txn) => txn.type === "debit").reduce((sum, txn) => sum + txn.amount, 0)

    const monthlyIncome = transactions.filter((txn) => txn.type === "credit").reduce((sum, txn) => sum + txn.amount, 0)

    const categorySpending = transactions
      .filter((txn) => txn.type === "debit")
      .reduce(
        (acc, txn) => {
          acc[txn.category] = (acc[txn.category] || 0) + txn.amount
          return acc
        },
        {} as Record<string, number>,
      )

    return {
      totalBalance: user.checkingBalance + user.savingsBalance,
      availableBalance: user.availableCheckingBalance + user.availableSavingsBalance,
      monthlySpending,
      monthlyIncome,
      transactionCount: transactions.length,
      billCount: bills.length,
      categorySpending,
      averageTransaction:
        transactions.length > 0 ? transactions.reduce((sum, txn) => sum + txn.amount, 0) / transactions.length : 0,
    }
  }

  getSystemAnalytics() {
    const totalUsers = this.data.users.length
    const activeUsers = this.data.users.filter(
      (u) => u.lastLogin && new Date(u.lastLogin).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).length

    const totalTransactions = this.data.transactions.length
    const totalVolume = this.data.transactions.reduce((sum, txn) => sum + txn.amount, 0)
    const totalDeposits = this.data.users.reduce((sum, user) => sum + user.checkingBalance + user.savingsBalance, 0)

    const statusBreakdown = this.data.users.reduce(
      (acc, user) => {
        acc[user.accountStatus] = (acc[user.accountStatus] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalUsers,
      activeUsers,
      totalTransactions,
      totalVolume,
      totalDeposits,
      statusBreakdown,
      averageBalance: this.data.metadata.averageAccountBalance,
      signupRate: this.data.metadata.totalSignups,
      loginRate: this.data.metadata.totalLogins,
    }
  }

  // Existing methods remain the same
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
        this.data.bills = this.data.bills.filter((bill) => bill.userId !== id)
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
        totalBills: this.data.bills.length,
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
        totalBills: 0,
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
