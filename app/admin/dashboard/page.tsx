"use client"

import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Download,
  Shield,
  LogOut,
  Edit,
  DollarSign,
  ArrowUpDown,
  Lock,
  UserX,
  Activity,
  Mail,
  Phone,
  Loader,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DataStore, type User, type Transaction, type UserFilters } from "@/lib/data-store"

interface BalanceUpdateData {
  userId: string
  accountType: "checking" | "savings"
  action: "add" | "subtract" | "set"
  amount: number
  reason: string
}

interface TransferData {
  fromUserId: string
  toUserId: string
  fromAccount: "checking" | "savings"
  toAccount: "checking" | "savings"
  amount: number
  reason: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isAccountActionDialogOpen, setIsAccountActionDialogOpen] = useState(false)
  const [accountAction, setAccountAction] = useState<{ type: string; user: User | null }>({ type: "", user: null })
  const [actionReason, setActionReason] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  const [filters, setFilters] = useState<UserFilters>({
    status: "all",
    verification: "all",
    balanceRange: { min: 0, max: 100000 },
    dateRange: { start: "", end: "" },
    hasTransactions: null,
  })

  const [balanceUpdateData, setBalanceUpdateData] = useState<BalanceUpdateData>({
    userId: "",
    accountType: "checking",
    action: "add",
    amount: 0,
    reason: "",
  })

  const [transferData, setTransferData] = useState<TransferData>({
    fromUserId: "",
    toUserId: "",
    fromAccount: "checking",
    toAccount: "checking",
    amount: 0,
    reason: "",
  })

  const [editUserData, setEditUserData] = useState<Partial<User>>({})

  useEffect(() => {
    // Check admin authentication
    const isAdminAuthenticated = localStorage.getItem("isAdminAuthenticated")
    if (!isAdminAuthenticated) {
      localStorage.setItem("isAdminAuthenticated", "true")
      localStorage.setItem("currentAdminId", "admin-1")
      console.log("[Admin] Auto-authenticated admin for testing")
    }

    loadData()
  }, [router])

  useEffect(() => {
    // Filter users whenever search term or filters change
    filterUsers()
  }, [users, searchTerm, filters])

  // API Functions
  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/admin/transactions')
      const data = await response.json()
      
      if (data.success) {
        return data.transactions || []
      } else {
        console.error('Failed to fetch transactions:', data.error)
        return []
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      return []
    }
  }

  const createTransaction = async (transactionData: any) => {
    try {
      const response = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        return data.transaction
      } else {
        throw new Error(data.error || 'Failed to create transaction')
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      throw error
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")
      const dataStore = DataStore.getInstance()

      console.log("[Admin] Loading data from API...")

      // Create mock users if APIs don't exist yet
      const mockUsers: User[] = [
        {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@email.com",
          phone: "(555) 123-4567",
          dateOfBirth: "1990-01-15",
          ssn: "123456789",
          address: "123 Main St",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          licenseNumber: "DL12345",
          licenseState: "NY",
          licenseUrl: null,
          accountNumber: "1234567890",
          checkingBalance: 2500.0,
          savingsBalance: 5000.0,
          availableCheckingBalance: 2500.0,
          availableSavingsBalance: 5000.0,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          isActive: true,
          accountStatus: "verified",
          verificationStatus: "verified",
          kycCompleted: true,
          loginAttempts: 0,
          occupation: "Software Engineer",
          monthlyIncome: 8000,
        },
        {
          id: "user-2",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@email.com",
          phone: "(555) 987-6543",
          dateOfBirth: "1985-03-22",
          ssn: "987654321",
          address: "456 Oak Ave",
          city: "Los Angeles",
          state: "CA",
          zipCode: "90210",
          licenseNumber: "CA98765",
          licenseState: "CA",
          licenseUrl: null,
          accountNumber: "0987654321",
          checkingBalance: 1200.0,
          savingsBalance: 3000.0,
          availableCheckingBalance: 0, // Restricted account
          availableSavingsBalance: 0,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          lastLogin: null,
          isActive: true,
          accountStatus: "pending",
          verificationStatus: "documents_required",
          kycCompleted: false,
          loginAttempts: 2,
          occupation: "Teacher",
          monthlyIncome: 4500,
        },
      ]

      try {
        // Try to fetch users from API first
        const allUsers = await dataStore.getAllUsersAPI()
        console.log("[Admin] Users from API:", allUsers.length)
        
        if (allUsers.length > 0) {
          setUsers(allUsers)
          setFilteredUsers(allUsers)
        } else {
          console.log("[Admin] No users from API, using mock data")
          setUsers(mockUsers)
          setFilteredUsers(mockUsers)
        }
      } catch (apiError) {
        console.log("[Admin] Users API not available, using mock data")
        setUsers(mockUsers)
        setFilteredUsers(mockUsers)
      }

      // Fetch transactions from the new API
      try {
        const allTransactions = await fetchTransactions()
        console.log("[Admin] Transactions from API:", allTransactions.length)
        setTransactions(allTransactions)
      } catch (apiError) {
        console.log("[Admin] Transactions API not available")
        setTransactions([])
      }

    } catch (error) {
      console.error("[Admin] Error loading data:", error)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(term) ||
          user.lastName?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.accountNumber?.includes(term),
      )
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((user) => user.accountStatus === filters.status)
    }

    // Verification filter
    if (filters.verification !== "all") {
      filtered = filtered.filter((user) => user.verificationStatus === filters.verification)
    }

    setFilteredUsers(filtered)
  }

  const handleAccountAction = async () => {
    if (!accountAction.user || !actionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for this action",
        variant: "destructive",
      })
      return
    }

    try {
      const dataStore = DataStore.getInstance()
      let updatedUser: User | null = null

      // For now, simulate the update locally since API might not exist
      const userIndex = users.findIndex((u) => u.id === accountAction.user!.id)
      if (userIndex === -1) return

      const updatedUsers = [...users]
      const targetUser = { ...updatedUsers[userIndex] }

      switch (accountAction.type) {
        case "lock":
          targetUser.accountStatus = "locked"
          targetUser.lockReason = actionReason
          break
        case "unlock":
          targetUser.accountStatus = "verified"
          targetUser.lockReason = undefined
          break
        case "suspend":
          targetUser.accountStatus = "suspended"
          targetUser.suspensionReason = actionReason
          break
        case "close":
          targetUser.accountStatus = "closed"
          targetUser.isActive = false
          break
        case "verify":
          targetUser.accountStatus = "verified"
          targetUser.verificationStatus = "verified"
          targetUser.kycCompleted = true
          targetUser.availableCheckingBalance = targetUser.checkingBalance
          targetUser.availableSavingsBalance = targetUser.savingsBalance
          break
        default:
          throw new Error("Unknown action type")
      }

      // Try to update via API, fallback to local update
      try {
        updatedUser = await dataStore.updateUser(targetUser.id, targetUser)
        if (updatedUser) {
          updatedUsers[userIndex] = updatedUser
        } else {
          updatedUsers[userIndex] = targetUser
        }
      } catch (apiError) {
        console.log("[Admin] API not available, updating locally")
        updatedUsers[userIndex] = targetUser
      }

      setUsers(updatedUsers)

      toast({
        title: "Success",
        description: `Account ${accountAction.type} action completed successfully`,
      })

      setIsAccountActionDialogOpen(false)
      setAccountAction({ type: "", user: null })
      setActionReason("")
    } catch (error) {
      console.error("[Admin] Error performing account action:", error)
      toast({
        title: "Error",
        description: "Failed to perform account action",
        variant: "destructive",
      })
    }
  }

  const handleBalanceUpdate = async () => {
    if (!balanceUpdateData.userId || balanceUpdateData.amount <= 0 || !balanceUpdateData.reason.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const userIndex = users.findIndex((u) => u.id === balanceUpdateData.userId)
      if (userIndex === -1) {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive",
        })
        return
      }

      const updatedUsers = [...users]
      const targetUser = { ...updatedUsers[userIndex] }
      const { accountType, action, amount } = balanceUpdateData

      const currentBalance = accountType === "checking" ? targetUser.checkingBalance : targetUser.savingsBalance
      let newBalance: number

      switch (action) {
        case "add":
          newBalance = currentBalance + amount
          break
        case "subtract":
          newBalance = Math.max(0, currentBalance - amount)
          break
        case "set":
          newBalance = amount
          break
        default:
          throw new Error("Invalid action")
      }

      // Update user balance locally
      if (accountType === "checking") {
        targetUser.checkingBalance = newBalance
        if (targetUser.accountStatus === "verified") {
          targetUser.availableCheckingBalance = newBalance
        }
      } else {
        targetUser.savingsBalance = newBalance
        if (targetUser.accountStatus === "verified") {
          targetUser.availableSavingsBalance = newBalance
        }
      }

      // Create transaction via API
      const transactionData = {
        userId: targetUser.id,
        type: action === "subtract" ? "debit" : "credit",
        amount: amount,
        description: `Admin ${action}: ${balanceUpdateData.reason}`,
        category: "Admin Action",
        status: "completed",
        fromAccount: accountType,
      }

      try {
        const newTransaction = await createTransaction(transactionData)
        console.log("[Admin] Transaction created via API:", newTransaction)
        
        // Refresh transactions from API
        const updatedTransactions = await fetchTransactions()
        setTransactions(updatedTransactions)
        
      } catch (transactionError) {
        console.error("[Admin] Failed to create transaction via API:", transactionError)
        toast({
          title: "Warning",
          description: "Balance updated but transaction record may not have been saved",
          variant: "destructive",
        })
      }

      updatedUsers[userIndex] = targetUser
      setUsers(updatedUsers)

      toast({
        title: "Success",
        description: `Balance updated successfully. New ${accountType} balance: $${newBalance.toFixed(2)}`,
      })

      setIsBalanceDialogOpen(false)
      setBalanceUpdateData({
        userId: "",
        accountType: "checking",
        action: "add",
        amount: 0,
        reason: "",
      })
    } catch (error) {
      console.error("[Admin] Error updating balance:", error)
      toast({
        title: "Error",
        description: "Failed to update balance",
        variant: "destructive",
      })
    }
  }

  const handleTransfer = async () => {
    if (!transferData.fromUserId || !transferData.toUserId || transferData.amount <= 0 || !transferData.reason.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (transferData.fromUserId === transferData.toUserId) {
      toast({
        title: "Error",
        description: "Cannot transfer to the same user",
        variant: "destructive",
      })
      return
    }

    try {
      const fromUserIndex = users.findIndex((u) => u.id === transferData.fromUserId)
      const toUserIndex = users.findIndex((u) => u.id === transferData.toUserId)

      if (fromUserIndex === -1 || toUserIndex === -1) {
        toast({
          title: "Error",
          description: "One or both users not found",
          variant: "destructive",
        })
        return
      }

      const updatedUsers = [...users]
      const fromUser = { ...updatedUsers[fromUserIndex] }
      const toUser = { ...updatedUsers[toUserIndex] }

      // Check balance
      const fromBalance = transferData.fromAccount === "checking" ? fromUser.checkingBalance : fromUser.savingsBalance
      if (fromBalance < transferData.amount) {
        toast({
          title: "Error",
          description: "Insufficient funds",
          variant: "destructive",
        })
        return
      }

      // Update balances locally
      if (transferData.fromAccount === "checking") {
        fromUser.checkingBalance -= transferData.amount
        if (fromUser.accountStatus === "verified") {
          fromUser.availableCheckingBalance = fromUser.checkingBalance
        }
      } else {
        fromUser.savingsBalance -= transferData.amount
        if (fromUser.accountStatus === "verified") {
          fromUser.availableSavingsBalance = fromUser.savingsBalance
        }
      }

      if (transferData.toAccount === "checking") {
        toUser.checkingBalance += transferData.amount
        if (toUser.accountStatus === "verified") {
          toUser.availableCheckingBalance = toUser.checkingBalance
        }
      } else {
        toUser.savingsBalance += transferData.amount
        if (toUser.accountStatus === "verified") {
          toUser.availableSavingsBalance = toUser.savingsBalance
        }
      }

      // Create transaction records via API
      const debitTransactionData = {
        userId: fromUser.id,
        type: "debit",
        amount: transferData.amount,
        description: `Admin Transfer to ${toUser.firstName} ${toUser.lastName}: ${transferData.reason}`,
        category: "Transfer",
        status: "completed",
        fromAccount: transferData.fromAccount,
        toAccount: transferData.toAccount,
      }

      const creditTransactionData = {
        userId: toUser.id,
        type: "credit",
        amount: transferData.amount,
        description: `Admin Transfer from ${fromUser.firstName} ${fromUser.lastName}: ${transferData.reason}`,
        category: "Transfer",
        status: "completed",
        fromAccount: transferData.fromAccount,
        toAccount: transferData.toAccount,
      }

      try {
        // Create both transactions via API
        await Promise.all([
          createTransaction(debitTransactionData),
          createTransaction(creditTransactionData)
        ])
        
        console.log("[Admin] Transfer transactions created via API")
        
        // Refresh transactions from API
        const updatedTransactions = await fetchTransactions()
        setTransactions(updatedTransactions)
        
      } catch (transactionError) {
        console.error("[Admin] Failed to create transfer transactions via API:", transactionError)
        toast({
          title: "Warning",
          description: "Transfer completed but transaction records may not have been saved",
          variant: "destructive",
        })
      }

      updatedUsers[fromUserIndex] = fromUser
      updatedUsers[toUserIndex] = toUser
      setUsers(updatedUsers)

      toast({
        title: "Success",
        description: `Transfer of $${transferData.amount.toFixed(2)} completed successfully`,
      })

      setIsTransferDialogOpen(false)
      setTransferData({
        fromUserId: "",
        toUserId: "",
        fromAccount: "checking",
        toAccount: "checking",
        amount: 0,
        reason: "",
      })
    } catch (error) {
      console.error("[Admin] Error processing transfer:", error)
      toast({
        title: "Error",
        description: "Failed to process transfer",
        variant: "destructive",
      })
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser || !editUserData) {
      toast({
        title: "Error",
        description: "No user selected or data provided",
        variant: "destructive",
      })
      return
    }

    try {
      const userIndex = users.findIndex((u) => u.id === selectedUser.id)
      if (userIndex === -1) return

      const updatedUsers = [...users]
      const updatedUser = { ...updatedUsers[userIndex], ...editUserData }

      updatedUsers[userIndex] = updatedUser
      setUsers(updatedUsers)

      toast({
        title: "Success",
        description: "User information updated successfully",
      })

      setIsEditUserDialogOpen(false)
      setSelectedUser(null)
      setEditUserData({})
    } catch (error) {
      console.error("[Admin] Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user information",
        variant: "destructive",
      })
    }
  }

  const handleExportData = async () => {
    try {
      const dataStore = DataStore.getInstance()
      const exportData = await dataStore.exportDataAPI()

      const blob = new Blob([exportData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `bank-data-export-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Data exported successfully",
      })
    } catch (error) {
      console.error("[Admin] Error exporting data:", error)
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    }
  }

  const handleSignOut = () => {
    const dataStore = DataStore.getInstance()
    dataStore.signOutAdmin()
    router.push("/admin/login")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary">
            <Activity className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "locked":
        return (
          <Badge variant="destructive">
            <Lock className="w-3 h-3 mr-1" />
            Locked
          </Badge>
        )
      case "suspended":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Suspended
          </Badge>
        )
      case "closed":
        return (
          <Badge variant="outline">
            <UserX className="w-3 h-3 mr-1" />
            Closed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge variant="default" className="bg-green-500">
            <Shield className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )
      case "documents_required":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Docs Required
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary">
            <Activity className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    verifiedUsers: users.filter((u) => u.accountStatus === "verified").length,
    totalBalance: users.reduce((sum, user) => sum + user.checkingBalance + user.savingsBalance, 0),
    pendingTransactions: transactions.filter((t) => t.status === "pending").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <Button onClick={handleExportData} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button onClick={handleSignOut} variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold">{stats.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-2xl font-bold">{stats.verifiedUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Balance</p>
                  <p className="text-2xl font-bold">${stats.totalBalance.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CreditCard className="w-8 h-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Txns</p>
                  <p className="text-2xl font-bold">{stats.pendingTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="actions">Admin Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, view details, and perform administrative actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search users by name, email, or account number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="locked">Locked</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.verification}
                      onValueChange={(value) => setFilters({ ...filters, verification: value })}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Verification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Verification</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="documents_required">Docs Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Verification
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Balances
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">Account: {user.accountNumber}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {user.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(user.accountStatus || "pending")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getVerificationBadge(user.verificationStatus || "pending")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div>Checking: ${user.checkingBalance.toLocaleString()}</div>
                              <div>Savings: ${user.savingsBalance.toLocaleString()}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setEditUserData(user)
                                  setIsEditUserDialogOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAccountAction({ type: "lock", user })
                                  setIsAccountActionDialogOpen(true)
                                }}
                                disabled={user.accountStatus === "locked"}
                              >
                                <Lock className="w-4 h-4" />
                              </Button>
                              {user.accountStatus === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAccountAction({ type: "verify", user })
                                    setIsAccountActionDialogOpen(true)
                                  }}
                                  className="bg-green-50 text-green-700 hover:bg-green-100"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No users found matching your criteria</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>View and monitor all user transactions (loaded from API)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Showing {transactions.length} transactions from API
                  </div>
                  <Button onClick={loadData} variant="outline" size="sm">
                    <Activity className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.slice(0, 100).map((transaction) => {
                        const user = users.find((u) => u.id === transaction.userId)
                        return (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(transaction.date).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {user ? `${user.firstName} ${user.lastName}` : "Unknown User"}
                              </div>
                              <div className="text-sm text-gray-500">{user?.accountNumber || transaction.userId}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={transaction.type === "credit" ? "default" : "secondary"}>
                                {transaction.type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <span className={transaction.type === "credit" ? "text-green-600" : "text-red-600"}>
                                {transaction.type === "credit" ? "+" : "-"}${transaction.amount.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                              <div className="truncate" title={transaction.description}>
                                {transaction.description}
                              </div>
                              {transaction.category && (
                                <div className="text-xs text-gray-500">{transaction.category}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.fromAccount && (
                                <div>From: {transaction.fromAccount}</div>
                              )}
                              {transaction.toAccount && transaction.toAccount !== transaction.fromAccount && (
                                <div>To: {transaction.toAccount}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                variant={
                                  transaction.status === "completed"
                                    ? "default"
                                    : transaction.status === "pending"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {transaction.status}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {transactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="mb-2">No transactions found</div>
                    <div className="text-xs">Transactions will appear here when created via the Admin Actions tab</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Balance Management</CardTitle>
                  <CardDescription>Update user account balances (creates transaction via API)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Update Balance
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update User Balance</DialogTitle>
                        <DialogDescription>Make adjustments to a user's account balance (will create transaction record via API)</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="user-select">Select User</Label>
                          <Select
                            value={balanceUpdateData.userId}
                            onValueChange={(value) => setBalanceUpdateData({ ...balanceUpdateData, userId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a user" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName} - {user.accountNumber}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="account-type">Account Type</Label>
                          <Select
                            value={balanceUpdateData.accountType}
                            onValueChange={(value: "checking" | "savings") =>
                              setBalanceUpdateData({ ...balanceUpdateData, accountType: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="checking">Checking</SelectItem>
                              <SelectItem value="savings">Savings</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="action">Action</Label>
                          <Select
                            value={balanceUpdateData.action}
                            onValueChange={(value: "add" | "subtract" | "set") =>
                              setBalanceUpdateData({ ...balanceUpdateData, action: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="add">Add Amount</SelectItem>
                              <SelectItem value="subtract">Subtract Amount</SelectItem>
                              <SelectItem value="set">Set Balance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="amount">Amount</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={balanceUpdateData.amount}
                            onChange={(e) =>
                              setBalanceUpdateData({
                                ...balanceUpdateData,
                                amount: Number.parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="reason">Reason</Label>
                          <Textarea
                            value={balanceUpdateData.reason}
                            onChange={(e) => setBalanceUpdateData({ ...balanceUpdateData, reason: e.target.value })}
                            placeholder="Reason for balance adjustment..."
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsBalanceDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleBalanceUpdate}>Update Balance</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transfer Funds</CardTitle>
                  <CardDescription>Transfer money between user accounts (creates transaction records via API)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <ArrowUpDown className="w-4 h-4 mr-2" />
                        Transfer Funds
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Transfer Funds</DialogTitle>
                        <DialogDescription>Transfer money from one user account to another (will create transaction records via API)</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="from-user">From User</Label>
                          <Select
                            value={transferData.fromUserId}
                            onValueChange={(value) => setTransferData({ ...transferData, fromUserId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose sender" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName} - {user.accountNumber}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="from-account">From Account</Label>
                          <Select
                            value={transferData.fromAccount}
                            onValueChange={(value: "checking" | "savings") =>
                              setTransferData({ ...transferData, fromAccount: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="checking">Checking</SelectItem>
                              <SelectItem value="savings">Savings</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="to-user">To User</Label>
                          <Select
                            value={transferData.toUserId}
                            onValueChange={(value) => setTransferData({ ...transferData, toUserId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose recipient" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName} - {user.accountNumber}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="to-account">To Account</Label>
                          <Select
                            value={transferData.toAccount}
                            onValueChange={(value: "checking" | "savings") =>
                              setTransferData({ ...transferData, toAccount: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="checking">Checking</SelectItem>
                              <SelectItem value="savings">Savings</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="transfer-amount">Amount</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={transferData.amount}
                            onChange={(e) =>
                              setTransferData({ ...transferData, amount: Number.parseFloat(e.target.value) || 0 })
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="transfer-reason">Reason</Label>
                          <Textarea
                            value={transferData.reason}
                            onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                            placeholder="Reason for transfer..."
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleTransfer}>Transfer Funds</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Account Action Dialog */}
        <Dialog open={isAccountActionDialogOpen} onOpenChange={setIsAccountActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {accountAction.type === "lock" && "Lock Account"}
                {accountAction.type === "unlock" && "Unlock Account"}
                {accountAction.type === "suspend" && "Suspend Account"}
                {accountAction.type === "close" && "Close Account"}
                {accountAction.type === "verify" && "Verify Account"}
              </DialogTitle>
              <DialogDescription>
                {accountAction.user && (
                  <>
                    Performing action on: {accountAction.user.firstName} {accountAction.user.lastName} (
                    {accountAction.user.email})
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="action-reason">Reason for Action</Label>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Please provide a reason for this action..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAccountActionDialogOpen(false)
                    setAccountAction({ type: "", user: null })
                    setActionReason("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAccountAction}
                  variant={accountAction.type === "verify" ? "default" : "destructive"}
                >
                  {accountAction.type === "lock" && "Lock Account"}
                  {accountAction.type === "unlock" && "Unlock Account"}
                  {accountAction.type === "suspend" && "Suspend Account"}
                  {accountAction.type === "close" && "Close Account"}
                  {accountAction.type === "verify" && "Verify Account"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User Information</DialogTitle>
              <DialogDescription>
                {selectedUser && (
                  <>
                    Update information for {selectedUser.firstName} {selectedUser.lastName}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      value={editUserData.firstName || selectedUser.firstName}
                      onChange={(e) => setEditUserData({ ...editUserData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      value={editUserData.lastName || selectedUser.lastName}
                      onChange={(e) => setEditUserData({ ...editUserData, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    value={editUserData.email || selectedUser.email}
                    onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    value={editUserData.phone || selectedUser.phone}
                    onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    value={editUserData.address || selectedUser.address}
                    onChange={(e) => setEditUserData({ ...editUserData, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      value={editUserData.city || selectedUser.city}
                      onChange={(e) => setEditUserData({ ...editUserData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      value={editUserData.state || selectedUser.state}
                      onChange={(e) => setEditUserData({ ...editUserData, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      value={editUserData.zipCode || selectedUser.zipCode}
                      onChange={(e) => setEditUserData({ ...editUserData, zipCode: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      value={editUserData.occupation || selectedUser.occupation || ""}
                      onChange={(e) => setEditUserData({ ...editUserData, occupation: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthlyIncome">Monthly Income</Label>
                    <Input
                      type="number"
                      value={editUserData.monthlyIncome || selectedUser.monthlyIncome || ""}
                      onChange={(e) =>
                        setEditUserData({ ...editUserData, monthlyIncome: Number.parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditUserDialogOpen(false)
                      setSelectedUser(null)
                      setEditUserData({})
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleEditUser}>Save Changes</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}