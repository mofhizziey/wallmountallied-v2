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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Eye,
  Shield,
  LogOut,
  Edit,
  DollarSign,
  ArrowUpDown,
  Calendar,
  Lock,
  Unlock,
  UserX,
  Activity,
  Mail,
  Phone,
  MapPin,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DataStore, type User, type Transaction } from "@/lib/data-store"

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

interface UserFilters {
  status: string
  verification: string
  balanceRange: { min: number; max: number }
  dateRange: { start: string; end: string }
  hasTransactions: boolean | null
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
    const isAdminAuthenticated = localStorage.getItem("isAdminAuthenticated")
    if (!isAdminAuthenticated) {
      router.push("/admin")
      return
    }

    loadData()
  }, [router])

  useEffect(() => {
    const dataStore = DataStore.getInstance()
    const filtered = dataStore.searchUsers(searchTerm, {
      status: filters.status,
      verification: filters.verification,
      balanceRange: filters.balanceRange,
      dateRange: filters.dateRange.start ? filters.dateRange : undefined,
      hasTransactions: filters.hasTransactions,
    })
    setFilteredUsers(filtered)
  }, [users, searchTerm, filters])

  const loadData = async () => {
    const dataStore = DataStore.getInstance()
    const allUsers = dataStore.getAllUsers()
    const allTransactions = dataStore.getAllTransactions()
    setUsers(allUsers)
    setTransactions(allTransactions)
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

    const dataStore = DataStore.getInstance()
    let updatedUser: User | undefined

    switch (accountAction.type) {
      case "lock":
        updatedUser = await dataStore.lockUserAccount(accountAction.user.id, actionReason)
        break
      case "unlock":
        updatedUser = await dataStore.unlockUserAccount(accountAction.user.id)
        break
      case "suspend":
        updatedUser = await dataStore.suspendUserAccount(accountAction.user.id, actionReason)
        break
      case "close":
        updatedUser = await dataStore.closeUserAccount(accountAction.user.id)
        break
      case "verify":
        updatedUser = await dataStore.updateUser(accountAction.user.id, {
          accountStatus: "verified",
          verificationStatus: "verified",
          kycCompleted: true,
          availableCheckingBalance: accountAction.user.checkingBalance,
          availableSavingsBalance: accountAction.user.savingsBalance,
        })
        break
    }

    if (updatedUser) {
      await loadData()
      setIsAccountActionDialogOpen(false)
      setAccountAction({ type: "", user: null })
      setActionReason("")

      toast({
        title: "Action Completed",
        description: `User account has been ${accountAction.type}${accountAction.type === "verify" ? "ied" : "ed"} successfully`,
      })
    }
  }

  const handleBalanceUpdate = async () => {
    if (!balanceUpdateData.userId || balanceUpdateData.amount <= 0 || !balanceUpdateData.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const dataStore = DataStore.getInstance()
    const user = dataStore.getUserById(balanceUpdateData.userId)
    if (!user) return

    let newBalance = 0
    const currentBalance = balanceUpdateData.accountType === "checking" ? user.checkingBalance : user.savingsBalance

    switch (balanceUpdateData.action) {
      case "add":
        newBalance = currentBalance + balanceUpdateData.amount
        break
      case "subtract":
        newBalance = Math.max(0, currentBalance - balanceUpdateData.amount)
        break
      case "set":
        newBalance = balanceUpdateData.amount
        break
    }

    const updateData: Partial<User> = {}
    if (balanceUpdateData.accountType === "checking") {
      updateData.checkingBalance = newBalance
      if (user.accountStatus === "verified") {
        updateData.availableCheckingBalance = newBalance
      }
    } else {
      updateData.savingsBalance = newBalance
      if (user.accountStatus === "verified") {
        updateData.availableSavingsBalance = newBalance
      }
    }

    const updatedUser = await dataStore.updateUser(balanceUpdateData.userId, updateData)

    if (updatedUser) {
      await dataStore.createTransaction({
        userId: balanceUpdateData.userId,
        type: balanceUpdateData.action === "subtract" ? "debit" : "credit",
        amount: balanceUpdateData.amount,
        description: `Admin ${balanceUpdateData.action}: ${balanceUpdateData.reason}`,
        category: "Admin Action",
        fromAccount: balanceUpdateData.accountType,
      })

      await loadData()
      setIsBalanceDialogOpen(false)
      setBalanceUpdateData({
        userId: "",
        accountType: "checking",
        action: "add",
        amount: 0,
        reason: "",
      })

      toast({
        title: "Balance Updated",
        description: `${balanceUpdateData.accountType} balance ${balanceUpdateData.action}ed successfully`,
      })
    }
  }

  const handleTransfer = async () => {
    if (
      !transferData.fromUserId ||
      !transferData.toUserId ||
      transferData.amount <= 0 ||
      !transferData.reason ||
      transferData.fromUserId === transferData.toUserId
    ) {
      toast({
        title: "Error",
        description: "Please fill in all fields correctly",
        variant: "destructive",
      })
      return
    }

    const dataStore = DataStore.getInstance()
    const fromUser = dataStore.getUserById(transferData.fromUserId)
    const toUser = dataStore.getUserById(transferData.toUserId)

    if (!fromUser || !toUser) return

    const fromBalance = transferData.fromAccount === "checking" ? fromUser.checkingBalance : fromUser.savingsBalance
    const toBalance = transferData.toAccount === "checking" ? toUser.checkingBalance : toUser.savingsBalance

    if (fromBalance < transferData.amount) {
      toast({
        title: "Insufficient Funds",
        description: "The source account doesn't have enough funds",
        variant: "destructive",
      })
      return
    }

    const fromUpdateData: Partial<User> = {}
    if (transferData.fromAccount === "checking") {
      fromUpdateData.checkingBalance = fromBalance - transferData.amount
      if (fromUser.accountStatus === "verified") {
        fromUpdateData.availableCheckingBalance = fromBalance - transferData.amount
      }
    } else {
      fromUpdateData.savingsBalance = fromBalance - transferData.amount
      if (fromUser.accountStatus === "verified") {
        fromUpdateData.availableSavingsBalance = fromBalance - transferData.amount
      }
    }

    const toUpdateData: Partial<User> = {}
    if (transferData.toAccount === "checking") {
      toUpdateData.checkingBalance = toBalance + transferData.amount
      if (toUser.accountStatus === "verified") {
        toUpdateData.availableCheckingBalance = toBalance + transferData.amount
      }
    } else {
      toUpdateData.savingsBalance = toBalance + transferData.amount
      if (toUser.accountStatus === "verified") {
        toUpdateData.availableSavingsBalance = toBalance + transferData.amount
      }
    }

    await dataStore.updateUser(transferData.fromUserId, fromUpdateData)
    await dataStore.updateUser(transferData.toUserId, toUpdateData)

    await dataStore.createTransaction({
      userId: transferData.fromUserId,
      type: "debit",
      amount: transferData.amount,
      description: `Admin transfer to ${toUser.firstName} ${toUser.lastName}: ${transferData.reason}`,
      category: "Transfer",
      fromAccount: transferData.fromAccount,
      toAccount: `${toUser.firstName} ${toUser.lastName} (${transferData.toAccount})`,
    })

    await dataStore.createTransaction({
      userId: transferData.toUserId,
      type: "credit",
      amount: transferData.amount,
      description: `Admin transfer from ${fromUser.firstName} ${fromUser.lastName}: ${transferData.reason}`,
      category: "Transfer",
      fromAccount: transferData.toAccount,
    })

    await loadData()
    setIsTransferDialogOpen(false)
    setTransferData({
      fromUserId: "",
      toUserId: "",
      fromAccount: "checking",
      toAccount: "checking",
      amount: 0,
      reason: "",
    })

    toast({
      title: "Transfer Completed",
      description: `Successfully transferred $${transferData.amount.toFixed(2)}`,
    })
  }

  const handleEditUser = async () => {
    if (!selectedUser || !editUserData) return

    const dataStore = DataStore.getInstance()
    const updatedUser = await dataStore.updateUser(selectedUser.id, editUserData)

    if (updatedUser) {
      await loadData()
      setIsEditUserDialogOpen(false)
      setEditUserData({})
      toast({
        title: "User Updated",
        description: "User information has been updated successfully",
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("isAdminAuthenticated")
    localStorage.removeItem("currentAdminId")
    toast({
      title: "Logged out",
      description: "Admin session ended",
    })
    router.push("/admin")
  }

  const exportUserData = () => {
    const dataStore = DataStore.getInstance()
    const data = dataStore.exportData()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bank-data-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      case "locked":
        return "bg-orange-100 text-orange-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getVerificationColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800"
      case "pending":
      case "selfie_required":
      case "documents_required":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <AlertTriangle className="h-4 w-4" />
      case "suspended":
        return <XCircle className="h-4 w-4" />
      case "locked":
        return <Lock className="h-4 w-4" />
      case "closed":
        return <UserX className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const stats = {
    totalUsers: users.length,
    verifiedUsers: users.filter((u) => u.accountStatus === "verified").length,
    pendingUsers: users.filter((u) => u.accountStatus === "pending").length,
    suspendedUsers: users.filter((u) => u.accountStatus === "suspended").length,
    lockedUsers: users.filter((u) => u.accountStatus === "locked").length,
    totalDeposits: users.reduce((sum, u) => sum + u.checkingBalance + u.savingsBalance, 0),
    totalTransactions: transactions.length,
    activeUsers: users.filter(
      (u) => u.lastLogin && new Date(u.lastLogin).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">SecureBank Administrative Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={exportUserData}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>

              <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Update Balance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update User Balance</DialogTitle>
                    <DialogDescription>Modify a user's account balance with proper documentation</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select User</Label>
                      <Select
                        value={balanceUpdateData.userId}
                        onValueChange={(value) => setBalanceUpdateData((prev) => ({ ...prev, userId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} - {user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Account Type</Label>
                        <Select
                          value={balanceUpdateData.accountType}
                          onValueChange={(value: "checking" | "savings") =>
                            setBalanceUpdateData((prev) => ({ ...prev, accountType: value }))
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
                      <div className="space-y-2">
                        <Label>Action</Label>
                        <Select
                          value={balanceUpdateData.action}
                          onValueChange={(value: "add" | "subtract" | "set") =>
                            setBalanceUpdateData((prev) => ({ ...prev, action: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="add">Add Funds</SelectItem>
                            <SelectItem value="subtract">Subtract Funds</SelectItem>
                            <SelectItem value="set">Set Balance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={balanceUpdateData.amount}
                        onChange={(e) =>
                          setBalanceUpdateData((prev) => ({ ...prev, amount: Number.parseFloat(e.target.value) || 0 }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Textarea
                        value={balanceUpdateData.reason}
                        onChange={(e) => setBalanceUpdateData((prev) => ({ ...prev, reason: e.target.value }))}
                        placeholder="Explain the reason for this balance update..."
                      />
                    </div>
                    <Button onClick={handleBalanceUpdate} className="w-full">
                      Update Balance
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Transfer Funds
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Transfer Funds Between Users</DialogTitle>
                    <DialogDescription>Move money between user accounts</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>From User</Label>
                        <Select
                          value={transferData.fromUserId}
                          onValueChange={(value) => setTransferData((prev) => ({ ...prev, fromUserId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>To User</Label>
                        <Select
                          value={transferData.toUserId}
                          onValueChange={(value) => setTransferData((prev) => ({ ...prev, toUserId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users
                              .filter((user) => user.id !== transferData.fromUserId)
                              .map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>From Account</Label>
                        <Select
                          value={transferData.fromAccount}
                          onValueChange={(value: "checking" | "savings") =>
                            setTransferData((prev) => ({ ...prev, fromAccount: value }))
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
                      <div className="space-y-2">
                        <Label>To Account</Label>
                        <Select
                          value={transferData.toAccount}
                          onValueChange={(value: "checking" | "savings") =>
                            setTransferData((prev) => ({ ...prev, toAccount: value }))
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
                    </div>
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={transferData.amount}
                        onChange={(e) =>
                          setTransferData((prev) => ({ ...prev, amount: Number.parseFloat(e.target.value) || 0 }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Textarea
                        value={transferData.reason}
                        onChange={(e) => setTransferData((prev) => ({ ...prev, reason: e.target.value }))}
                        placeholder="Explain the reason for this transfer..."
                      />
                    </div>
                    <Button onClick={handleTransfer} className="w-full">
                      Execute Transfer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button onClick={handleLogout} variant="outline">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.verifiedUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.suspendedUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locked</CardTitle>
              <Lock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.lockedUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalDeposits)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced User Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Advanced User Management</CardTitle>
                <CardDescription>Comprehensive user filtering and management tools</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Enhanced Filters */}
            <div className="space-y-4 mb-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users by name, email, or account number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Verification Status</Label>
                  <Select
                    value={filters.verification}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, verification: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Verification</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="documents_required">Documents Required</SelectItem>
                      <SelectItem value="selfie_required">Selfie Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Balance Range</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.balanceRange.min}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          balanceRange: { ...prev.balanceRange, min: Number(e.target.value) || 0 },
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.balanceRange.max}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          balanceRange: { ...prev.balanceRange, max: Number(e.target.value) || 100000 },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Registration Date</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, start: e.target.value },
                        }))
                      }
                    />
                    <Input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, end: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Transaction Activity</Label>
                  <Select
                    value={filters.hasTransactions?.toString() || "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        hasTransactions: value === "all" ? null : value === "true",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="true">Has Transactions</SelectItem>
                      <SelectItem value="false">No Transactions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Showing {filteredUsers.length} of {users.length} users
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      status: "all",
                      verification: "all",
                      balanceRange: { min: 0, max: 100000 },
                      dateRange: { start: "", end: "" },
                      hasTransactions: null,
                    })
                  }
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">User</th>
                    <th className="text-left py-3 px-4 font-medium">Contact</th>
                    <th className="text-left py-3 px-4 font-medium">Account</th>
                    <th className="text-left py-3 px-4 font-medium">Balances</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Verification</th>
                    <th className="text-left py-3 px-4 font-medium">Activity</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {user.firstName[0]}
                              {user.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-gray-600">ID: {user.id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{user.phone}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">
                              {user.city}, {user.state}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-mono text-sm">****{user.accountNumber.slice(-4)}</p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(user.createdAt)}
                          </p>
                          {user.loginAttempts > 0 && (
                            <p className="text-xs text-red-500">Failed logins: {user.loginAttempts}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Checking:</span>
                            <span className="font-medium">{formatCurrency(user.checkingBalance)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-600">Available:</span>
                            <span className="text-green-600 font-medium">
                              {formatCurrency(user.availableCheckingBalance)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Savings:</span>
                            <span className="text-gray-600">{formatCurrency(user.savingsBalance)}</span>
                          </div>
                          <div className="text-xs text-gray-500 border-t pt-1">
                            Total: {formatCurrency(user.checkingBalance + user.savingsBalance)}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(user.accountStatus)}
                          <Badge className={getStatusColor(user.accountStatus)}>{user.accountStatus}</Badge>
                        </div>
                        {(user.lockReason || user.suspensionReason) && (
                          <p className="text-xs text-red-600 mt-1">{user.lockReason || user.suspensionReason}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getVerificationColor(user.verificationStatus)}>
                          {user.verificationStatus.replace("_", " ")}
                        </Badge>
                        {user.kycCompleted && <p className="text-xs text-green-600 mt-1">KYC Complete</p>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm space-y-1">
                          {user.lastLogin ? (
                            <p className="text-green-600">Last: {formatDate(user.lastLogin)}</p>
                          ) : (
                            <p className="text-gray-500">Never logged in</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Transactions: {transactions.filter((t) => t.userId === user.id).length}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user)
                              setEditUserData({
                                firstName: user.firstName,
                                lastName: user.lastName,
                                email: user.email,
                                phone: user.phone,
                                address: user.address,
                                city: user.city,
                                state: user.state,
                                zipCode: user.zipCode,
                                occupation: user.occupation,
                                monthlyIncome: user.monthlyIncome,
                              })
                              setIsEditUserDialogOpen(true)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>

                          {/* Status-specific action buttons */}
                          {user.accountStatus === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setAccountAction({ type: "verify", user })
                                setIsAccountActionDialogOpen(true)
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Verify
                            </Button>
                          )}

                          {user.accountStatus === "verified" && (
                            <>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setAccountAction({ type: "suspend", user })
                                  setIsAccountActionDialogOpen(true)
                                }}
                              >
                                Suspend
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAccountAction({ type: "lock", user })
                                  setIsAccountActionDialogOpen(true)
                                }}
                              >
                                <Lock className="h-3 w-3" />
                              </Button>
                            </>
                          )}

                          {user.accountStatus === "locked" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setAccountAction({ type: "unlock", user })
                                setIsAccountActionDialogOpen(true)
                              }}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <Unlock className="h-3 w-3" />
                            </Button>
                          )}

                          {user.accountStatus === "suspended" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setAccountAction({ type: "verify", user })
                                setIsAccountActionDialogOpen(true)
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Reactivate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Account Action Dialog */}
        <Dialog open={isAccountActionDialogOpen} onOpenChange={setIsAccountActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {accountAction.type === "verify" && "Verify Account"}
                {accountAction.type === "lock" && "Lock Account"}
                {accountAction.type === "unlock" && "Unlock Account"}
                {accountAction.type === "suspend" && "Suspend Account"}
                {accountAction.type === "close" && "Close Account"}
              </DialogTitle>
              <DialogDescription>
                {accountAction.user && (
                  <>
                    You are about to {accountAction.type} the account for{" "}
                    <strong>
                      {accountAction.user.firstName} {accountAction.user.lastName}
                    </strong>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Reason for Action</Label>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={`Explain why you are ${accountAction.type}ing this account...`}
                  required
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleAccountAction} className="flex-1">
                  Confirm {accountAction.type}
                </Button>
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
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced User Detail Modal */}
        {selectedUser && !isEditUserDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xl">
                        {selectedUser.firstName[0]}
                        {selectedUser.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </CardTitle>
                      <p className="text-gray-600">{selectedUser.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        {getStatusIcon(selectedUser.accountStatus)}
                        <Badge className={getStatusColor(selectedUser.accountStatus)}>
                          {selectedUser.accountStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="verification">Verification</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Basic Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>First Name</Label>
                            <p className="font-medium">{selectedUser.firstName}</p>
                          </div>
                          <div>
                            <Label>Last Name</Label>
                            <p className="font-medium">{selectedUser.lastName}</p>
                          </div>
                          <div>
                            <Label>Date of Birth</Label>
                            <p className="font-medium">{selectedUser.dateOfBirth}</p>
                          </div>
                          <div>
                            <Label>SSN</Label>
                            <p className="font-medium">***-**-{selectedUser.ssn.slice(-4)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Contact Information</h4>
                        <div className="space-y-3">
                          <div>
                            <Label>Email</Label>
                            <p className="font-medium">{selectedUser.email}</p>
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <p className="font-medium">{selectedUser.phone}</p>
                          </div>
                          <div>
                            <Label>Address</Label>
                            <p className="font-medium">
                              {selectedUser.address}
                              <br />
                              {selectedUser.city}, {selectedUser.state} {selectedUser.zipCode}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedUser.occupation && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <Label>Occupation</Label>
                          <p className="font-medium">{selectedUser.occupation}</p>
                        </div>
                        {selectedUser.monthlyIncome && (
                          <div>
                            <Label>Monthly Income</Label>
                            <p className="font-medium">{formatCurrency(selectedUser.monthlyIncome)}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="account" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Account Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Account Number</Label>
                            <p className="font-mono font-medium">{selectedUser.accountNumber}</p>
                          </div>
                          <div>
                            <Label>Created</Label>
                            <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                          </div>
                          <div>
                            <Label>Last Login</Label>
                            <p className="font-medium">
                              {selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : "Never"}
                            </p>
                          </div>
                          <div>
                            <Label>Login Attempts</Label>
                            <p
                              className={`font-medium ${selectedUser.loginAttempts > 0 ? "text-red-600" : "text-green-600"}`}
                            >
                              {selectedUser.loginAttempts}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Account Balances</h4>
                        <div className="space-y-3">
                          <div className="p-4 border rounded-lg">
                            <div className="flex justify-between items-center">
                              <span>Checking Balance</span>
                              <span className="font-bold text-lg">{formatCurrency(selectedUser.checkingBalance)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-green-600">
                              <span>Available</span>
                              <span>{formatCurrency(selectedUser.availableCheckingBalance)}</span>
                            </div>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <div className="flex justify-between items-center">
                              <span>Savings Balance</span>
                              <span className="font-bold text-lg">{formatCurrency(selectedUser.savingsBalance)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-green-600">
                              <span>Available</span>
                              <span>{formatCurrency(selectedUser.availableSavingsBalance)}</span>
                            </div>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="flex justify-between items-center font-semibold">
                              <span>Total Balance</span>
                              <span className="text-blue-600">
                                {formatCurrency(selectedUser.checkingBalance + selectedUser.savingsBalance)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-lg mb-4">Account Limits</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg text-center">
                          <p className="text-sm text-gray-600">Daily Transfer</p>
                          <p className="font-bold">
                            {formatCurrency(selectedUser.accountLimits?.dailyTransferLimit || 0)}
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                          <p className="text-sm text-gray-600">Monthly Transfer</p>
                          <p className="font-bold">
                            {formatCurrency(selectedUser.accountLimits?.monthlyTransferLimit || 0)}
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                          <p className="text-sm text-gray-600">Daily Withdrawal</p>
                          <p className="font-bold">
                            {formatCurrency(selectedUser.accountLimits?.dailyWithdrawalLimit || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="verification" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-lg mb-4">Verification Status</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span>Account Status</span>
                            <Badge className={getStatusColor(selectedUser.accountStatus)}>
                              {selectedUser.accountStatus}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span>Verification Status</span>
                            <Badge className={getVerificationColor(selectedUser.verificationStatus)}>
                              {selectedUser.verificationStatus.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span>KYC Completed</span>
                            <Badge
                              className={
                                selectedUser.kycCompleted ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }
                            >
                              {selectedUser.kycCompleted ? "Yes" : "No"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-lg mb-4">Documents</h4>
                        <div className="space-y-4">
                          {selectedUser.selfieUrl && (
                            <div>
                              <Label>Selfie Verification</Label>
                              <img
                                src={selectedUser.selfieUrl || "/placeholder.svg?height=128&width=128"}
                                alt="User selfie"
                                className="w-32 h-32 object-cover rounded-lg border mt-2"
                              />
                            </div>
                          )}
                          {selectedUser.licenseUrl && (
                            <div>
                              <Label>Driver's License</Label>
                              <div className="mt-2 space-y-2">
                                <img
                                  src={selectedUser.licenseUrl || "/placeholder.svg?height=160&width=256"}
                                  alt="Driver's license"
                                  className="w-64 h-40 object-contain border rounded-lg"
                                />
                                <div className="text-sm text-gray-600">
                                  <p>License #: {selectedUser.licenseNumber}</p>
                                  <p>State: {selectedUser.licenseState}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="transactions" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-lg">Transaction History</h4>
                      <Badge variant="secondary">
                        {transactions.filter((txn) => txn.userId === selectedUser.id).length} transactions
                      </Badge>
                    </div>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {transactions
                        .filter((txn) => txn.userId === selectedUser.id)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((transaction) => (
                          <div key={transaction.id} className="flex justify-between items-center p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`p-2 rounded-full ${
                                  transaction.type === "credit"
                                    ? "bg-green-100 text-green-600"
                                    : "bg-red-100 text-red-600"
                                }`}
                              >
                                {transaction.type === "credit" ? "+" : "-"}
                              </div>
                              <div>
                                <p className="font-medium">{transaction.description}</p>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <span>{formatDate(transaction.date)}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {transaction.category}
                                  </Badge>
                                  <Badge
                                    className={
                                      transaction.status === "completed"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }
                                  >
                                    {transaction.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-bold text-lg ${
                                  transaction.type === "credit" ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {transaction.type === "credit" ? "+" : "-"}
                                {formatCurrency(transaction.amount)}
                              </p>
                              {transaction.balanceAfter !== undefined && (
                                <p className="text-sm text-gray-500">
                                  Balance: {formatCurrency(transaction.balanceAfter)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="security" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-lg mb-4">Security Information</h4>
                        <div className="space-y-3">
                          <div className="p-3 border rounded-lg">
                            <div className="flex justify-between items-center">
                              <span>Failed Login Attempts</span>
                              <Badge
                                className={
                                  selectedUser.loginAttempts > 0
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                                }
                              >
                                {selectedUser.loginAttempts}
                              </Badge>
                            </div>
                          </div>
                          {selectedUser.lastLoginAttempt && (
                            <div className="p-3 border rounded-lg">
                              <div className="flex justify-between items-center">
                                <span>Last Login Attempt</span>
                                <span className="text-sm">{formatDate(selectedUser.lastLoginAttempt)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {(selectedUser.lockReason || selectedUser.suspensionReason) && (
                          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <h5 className="font-semibold text-red-800 mb-2">Account Restriction</h5>
                            <p className="text-red-700">{selectedUser.lockReason || selectedUser.suspensionReason}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-semibold text-lg mb-4">Preferences</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span>Notifications</span>
                            <Badge
                              className={
                                selectedUser.preferences?.notifications
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {selectedUser.preferences?.notifications ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span>Email Updates</span>
                            <Badge
                              className={
                                selectedUser.preferences?.emailUpdates
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {selectedUser.preferences?.emailUpdates ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span>Two Factor Auth</span>
                            <Badge
                              className={
                                selectedUser.preferences?.twoFactorAuth
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {selectedUser.preferences?.twoFactorAuth ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Edit User Dialog */}
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User Information</DialogTitle>
              <DialogDescription>Update comprehensive user information</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={editUserData.firstName || ""}
                        onChange={(e) => setEditUserData((prev) => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={editUserData.lastName || ""}
                        onChange={(e) => setEditUserData((prev) => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={editUserData.dateOfBirth || ""}
                        onChange={(e) => setEditUserData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Occupation</Label>
                      <Input
                        value={editUserData.occupation || ""}
                        onChange={(e) => setEditUserData((prev) => ({ ...prev, occupation: e.target.value }))}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editUserData.email || ""}
                        onChange={(e) => setEditUserData((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={editUserData.phone || ""}
                        onChange={(e) => setEditUserData((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input
                        value={editUserData.address || ""}
                        onChange={(e) => setEditUserData((prev) => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={editUserData.city || ""}
                          onChange={(e) => setEditUserData((prev) => ({ ...prev, city: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input
                          value={editUserData.state || ""}
                          onChange={(e) => setEditUserData((prev) => ({ ...prev, state: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ZIP Code</Label>
                        <Input
                          value={editUserData.zipCode || ""}
                          onChange={(e) => setEditUserData((prev) => ({ ...prev, zipCode: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Monthly Income</Label>
                      <Input
                        type="number"
                        value={editUserData.monthlyIncome || ""}
                        onChange={(e) =>
                          setEditUserData((prev) => ({
                            ...prev,
                            monthlyIncome: Number.parseFloat(e.target.value) || undefined,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Credit Score</Label>
                      <Input
                        type="number"
                        min="300"
                        max="850"
                        value={editUserData.creditScore || ""}
                        onChange={(e) =>
                          setEditUserData((prev) => ({
                            ...prev,
                            creditScore: Number.parseInt(e.target.value) || undefined,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Account Limits</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Daily Transfer Limit</Label>
                        <Input
                          type="number"
                          value={editUserData.accountLimits?.dailyTransferLimit || ""}
                          onChange={(e) =>
                            setEditUserData((prev) => ({
                              ...prev,
                              accountLimits: {
                                ...prev.accountLimits,
                                dailyTransferLimit: Number.parseFloat(e.target.value) || 5000,
                                monthlyTransferLimit: prev.accountLimits?.monthlyTransferLimit || 50000,
                                dailyWithdrawalLimit: prev.accountLimits?.dailyWithdrawalLimit || 1000,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Monthly Transfer Limit</Label>
                        <Input
                          type="number"
                          value={editUserData.accountLimits?.monthlyTransferLimit || ""}
                          onChange={(e) =>
                            setEditUserData((prev) => ({
                              ...prev,
                              accountLimits: {
                                ...prev.accountLimits,
                                dailyTransferLimit: prev.accountLimits?.dailyTransferLimit || 5000,
                                monthlyTransferLimit: Number.parseFloat(e.target.value) || 50000,
                                dailyWithdrawalLimit: prev.accountLimits?.dailyWithdrawalLimit || 1000,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Daily Withdrawal Limit</Label>
                        <Input
                          type="number"
                          value={editUserData.accountLimits?.dailyWithdrawalLimit || ""}
                          onChange={(e) =>
                            setEditUserData((prev) => ({
                              ...prev,
                              accountLimits: {
                                ...prev.accountLimits,
                                dailyTransferLimit: prev.accountLimits?.dailyTransferLimit || 5000,
                                monthlyTransferLimit: prev.accountLimits?.monthlyTransferLimit || 50000,
                                dailyWithdrawalLimit: Number.parseFloat(e.target.value) || 1000,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4">
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">User Preferences</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="notifications"
                          checked={editUserData.preferences?.notifications || false}
                          onCheckedChange={(checked) =>
                            setEditUserData((prev) => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                notifications: checked as boolean,
                                emailUpdates: prev.preferences?.emailUpdates || false,
                                twoFactorAuth: prev.preferences?.twoFactorAuth || false,
                              },
                            }))
                          }
                        />
                        <Label htmlFor="notifications">Enable Notifications</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="emailUpdates"
                          checked={editUserData.preferences?.emailUpdates || false}
                          onCheckedChange={(checked) =>
                            setEditUserData((prev) => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                notifications: prev.preferences?.notifications || false,
                                emailUpdates: checked as boolean,
                                twoFactorAuth: prev.preferences?.twoFactorAuth || false,
                              },
                            }))
                          }
                        />
                        <Label htmlFor="emailUpdates">Enable Email Updates</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="twoFactorAuth"
                          checked={editUserData.preferences?.twoFactorAuth || false}
                          onCheckedChange={(checked) =>
                            setEditUserData((prev) => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                notifications: prev.preferences?.notifications || false,
                                emailUpdates: prev.preferences?.emailUpdates || false,
                                twoFactorAuth: checked as boolean,
                              },
                            }))
                          }
                        />
                        <Label htmlFor="twoFactorAuth">Enable Two-Factor Authentication</Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex space-x-2 pt-4 border-t">
                <Button onClick={handleEditUser} className="flex-1">
                  Update User
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditUserDialogOpen(false)
                    setEditUserData({})
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
