"use client"

import { Label } from "@/components/ui/label"
import { useState, useEffect, useCallback } from "react"
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

export default function AdminDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [verificationFilter, setVerificationFilter] = useState("all")
  const [kycFilter, setKycFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
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

  // Function to load data from DataStore
  const loadData = useCallback(async () => {
    console.log("AdminDashboardPage: loadData called.")
    const dataStore = DataStore.getInstance()
    const allUsers = dataStore.getAllUsers()
    const allTransactions = dataStore.getAllTransactions()
    setUsers(allUsers)
    setTransactions(allTransactions)
    console.log("AdminDashboardPage: Users loaded:", allUsers.length, "Transactions loaded:", allTransactions.length)
  }, [])

  useEffect(() => {
    console.log("AdminDashboardPage: useEffect triggered.")
    // Check admin authentication
    const isAdminAuthenticated = localStorage.getItem("isAdminAuthenticated")
    if (!isAdminAuthenticated) {
      console.log("AdminDashboardPage: Admin not authenticated, redirecting to /admin.")
      router.push("/admin")
      return
    }
    console.log("AdminDashboardPage: Admin authenticated. Loading data...")
    loadData()
  }, [router, loadData])

  useEffect(() => {
    console.log("AdminDashboardPage: Filtering users based on search and filters.")
    let filtered = users
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.accountNumber.includes(searchTerm),
      )
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.accountStatus === statusFilter)
    }
    if (verificationFilter !== "all") {
      filtered = filtered.filter((user) => user.verificationStatus === verificationFilter)
    }
    if (kycFilter !== "all") {
      filtered = filtered.filter((user) => (kycFilter === "true" ? user.kycCompleted : !user.kycCompleted))
    }
    setFilteredUsers(filtered)
    console.log("AdminDashboardPage: Filtered users count:", filtered.length)
  }, [users, searchTerm, statusFilter, verificationFilter, kycFilter])

  const updateUserStatus = async (userId: string, newStatus: User["accountStatus"]) => {
    console.log(`AdminDashboardPage: Attempting to update user ${userId} status to ${newStatus}.`)
    const dataStore = DataStore.getInstance()
    const updatedUser = await dataStore.updateUser(userId, {
      accountStatus: newStatus,
      ...(newStatus === "verified" && {
        availableCheckingBalance: dataStore.getUserById(userId)?.checkingBalance || 0,
        availableSavingsBalance: dataStore.getUserById(userId)?.savingsBalance || 0,
        verificationStatus: "verified",
        kycCompleted: true,
      }),
    })
    if (updatedUser) {
      await loadData()
      toast({
        title: "User Account Status Updated",
        description: `User account status changed to ${newStatus}`,
      })
      console.log(`AdminDashboardPage: User ${userId} status updated successfully.`)
    } else {
      console.error(`AdminDashboardPage: Failed to update user ${userId} status.`)
    }
  }

  const updateVerificationStatus = async (userId: string, newStatus: User["verificationStatus"]) => {
    console.log(`AdminDashboardPage: Attempting to update user ${userId} verification status to ${newStatus}.`)
    const dataStore = DataStore.getInstance()
    const updatedUser = await dataStore.updateUser(userId, { verificationStatus: newStatus })
    if (updatedUser) {
      await loadData()
      toast({
        title: "Verification Status Updated",
        description: `User verification status changed to ${newStatus}`,
      })
      console.log(`AdminDashboardPage: User ${userId} verification status updated successfully.`)
    } else {
      console.error(`AdminDashboardPage: Failed to update user ${userId} verification status.`)
    }
  }

  const handleBalanceUpdate = async () => {
    console.log("AdminDashboardPage: Handling balance update.")
    if (!balanceUpdateData.userId || balanceUpdateData.amount <= 0 || !balanceUpdateData.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      console.warn("AdminDashboardPage: Balance update failed - missing required fields.")
      return
    }
    const dataStore = DataStore.getInstance()
    const user = dataStore.getUserById(balanceUpdateData.userId)
    if (!user) {
      console.error(`AdminDashboardPage: User ${balanceUpdateData.userId} not found for balance update.`)
      return
    }

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
      console.log(`AdminDashboardPage: Balance updated for user ${balanceUpdateData.userId}.`)
    } else {
      console.error(`AdminDashboardPage: Failed to update balance for user ${balanceUpdateData.userId}.`)
    }
  }

  const handleTransfer = async () => {
    console.log("AdminDashboardPage: Handling transfer.")
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
      console.warn("AdminDashboardPage: Transfer failed - missing or invalid fields.")
      return
    }

    const dataStore = DataStore.getInstance()
    const fromUser = dataStore.getUserById(transferData.fromUserId)
    const toUser = dataStore.getUserById(transferData.toUserId)

    if (!fromUser || !toUser) {
      console.error("AdminDashboardPage: Source or destination user not found for transfer.")
      return
    }

    const fromBalance = transferData.fromAccount === "checking" ? fromUser.checkingBalance : fromUser.savingsBalance
    const toBalance = transferData.toAccount === "checking" ? toUser.checkingBalance : toUser.savingsBalance

    if (fromBalance < transferData.amount) {
      toast({
        title: "Insufficient Funds",
        description: "The source account doesn't have enough funds",
        variant: "destructive",
      })
      console.warn("AdminDashboardPage: Transfer failed - insufficient funds.")
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
    console.log(`AdminDashboardPage: Transfer completed for $${transferData.amount.toFixed(2)}.`)
  }

  const handleEditUser = async () => {
    console.log("AdminDashboardPage: Handling user edit.")
    if (!selectedUser || !editUserData) {
      console.warn("AdminDashboardPage: Edit user failed - no user selected or no data to edit.")
      return
    }
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
      console.log(`AdminDashboardPage: User ${selectedUser.id} updated successfully.`)
    } else {
      console.error(`AdminDashboardPage: Failed to update user ${selectedUser.id}.`)
    }
  }

  const handleLogout = () => {
    console.log("AdminDashboardPage: Logging out admin.")
    toast({
      title: "Logged out",
      description: "Admin session ended",
    })

    localStorage.removeItem("isAdminAuthenticated")
    localStorage.removeItem("currentAdminId")

    window.location.replace("/admin")
    console.log("AdminDashboardPage: Redirected to /admin after logout.")
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
      case "closed":
        return "bg-gray-100 text-gray-800"
      case "locked":
        return "bg-purple-100 text-purple-800"
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

  const stats = {
    totalUsers: users.length,
    verifiedUsers: users.filter((u) => u.accountStatus === "verified").length,
    pendingUsers: users.filter((u) => u.accountStatus === "pending").length,
    suspendedUsers: users.filter((u) => u.accountStatus === "suspended").length,
    lockedUsers: users.filter((u) => u.accountStatus === "locked").length,
    totalDeposits: users.reduce((sum, u) => sum + u.checkingBalance + u.savingsBalance, 0),
    totalTransactions: transactions.length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">SecureBank Administrative Portal</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Update Balance
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Update User Balance</DialogTitle>
                    <DialogDescription>Modify a user's account balance with proper documentation</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="select-user-balance">Select User</Label>
                      <Select
                        value={balanceUpdateData.userId}
                        onValueChange={(value) => setBalanceUpdateData((prev) => ({ ...prev, userId: value }))}
                      >
                        <SelectTrigger id="select-user-balance">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="account-type">Account Type</Label>
                        <Select
                          value={balanceUpdateData.accountType}
                          onValueChange={(value: "checking" | "savings") =>
                            setBalanceUpdateData((prev) => ({ ...prev, accountType: value }))
                          }
                        >
                          <SelectTrigger id="account-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checking">Checking</SelectItem>
                            <SelectItem value="savings">Savings</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="action-type">Action</Label>
                        <Select
                          value={balanceUpdateData.action}
                          onValueChange={(value: "add" | "subtract" | "set") =>
                            setBalanceUpdateData((prev) => ({ ...prev, action: value }))
                          }
                        >
                          <SelectTrigger id="action-type">
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
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
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
                      <Label htmlFor="reason">Reason</Label>
                      <Textarea
                        id="reason"
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
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Transfer Funds Between Users</DialogTitle>
                    <DialogDescription>Move money between user accounts</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="from-user">From User</Label>
                        <Select
                          value={transferData.fromUserId}
                          onValueChange={(value) => setTransferData((prev) => ({ ...prev, fromUserId: value }))}
                        >
                          <SelectTrigger id="from-user">
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
                        <Label htmlFor="to-user">To User</Label>
                        <Select
                          value={transferData.toUserId}
                          onValueChange={(value) => setTransferData((prev) => ({ ...prev, toUserId: value }))}
                        >
                          <SelectTrigger id="to-user">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="from-account">From Account</Label>
                        <Select
                          value={transferData.fromAccount}
                          onValueChange={(value: "checking" | "savings") =>
                            setTransferData((prev) => ({ ...prev, fromAccount: value }))
                          }
                        >
                          <SelectTrigger id="from-account">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checking">Checking</SelectItem>
                            <SelectItem value="savings">Savings</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="to-account">To Account</Label>
                        <Select
                          value={transferData.toAccount}
                          onValueChange={(value: "checking" | "savings") =>
                            setTransferData((prev) => ({ ...prev, toAccount: value }))
                          }
                        >
                          <SelectTrigger id="to-account">
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
                      <Label htmlFor="transfer-amount">Amount</Label>
                      <Input
                        id="transfer-amount"
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
                      <Label htmlFor="transfer-reason">Reason</Label>
                      <Textarea
                        id="transfer-reason"
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
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
              <Lock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.lockedUsers}</div>
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
        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all user accounts</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Account Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Verification Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verification</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="selfie_required">Selfie Required</SelectItem>
                  <SelectItem value="documents_required">Documents Required</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={kycFilter} onValueChange={setKycFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="KYC Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All KYC</SelectItem>
                  <SelectItem value="true">Completed</SelectItem>
                  <SelectItem value="false">Not Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider">Account</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider">Balances</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider">
                      Verification
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        No users found. Please create users through the application's signup page.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-gray-600 truncate">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-mono text-sm text-gray-800">****{user.accountNumber.slice(-4)}</p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(user.createdAt)}
                          </p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-sm text-gray-800">
                            <p>Checking: {formatCurrency(user.checkingBalance)}</p>
                            <p className="text-green-600">Available: {formatCurrency(user.availableCheckingBalance)}</p>
                            <p className="text-gray-600">Savings: {formatCurrency(user.savingsBalance)}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge className={getStatusColor(user.accountStatus)}>{user.accountStatus}</Badge>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge className={getVerificationColor(user.verificationStatus)}>
                            {user.verificationStatus.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2">
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
                                })
                                setIsEditUserDialogOpen(true)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {user.accountStatus === "pending" && (
                              <Button
                                size="sm"
                                onClick={() => updateUserStatus(user.id, "verified")}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Verify
                              </Button>
                            )}
                            {(user.accountStatus === "verified" || user.accountStatus === "pending") && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateUserStatus(user.id, "suspended")}
                              >
                                Suspend
                              </Button>
                            )}
                            {(user.accountStatus === "verified" || user.accountStatus === "pending") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => updateUserStatus(user.id, "locked")}
                              >
                                <Lock className="h-3 w-3" />
                              </Button>
                            )}
                            {user.accountStatus === "locked" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => updateUserStatus(user.id, "verified")}
                              >
                                <Unlock className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        {/* User Detail Modal */}
        {selectedUser && !isEditUserDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>User Details</CardTitle>
                  <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="personal">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="verification">Verification</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  </TabsList>
                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>First Name</Label>
                        <p className="font-medium">{selectedUser.firstName}</p>
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        <p className="font-medium">{selectedUser.lastName}</p>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <p className="font-medium">{selectedUser.email}</p>
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <p className="font-medium">{selectedUser.phone}</p>
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
                    <div>
                      <Label>Address</Label>
                      <p className="font-medium">
                        {selectedUser.address}, {selectedUser.city}, {selectedUser.state} {selectedUser.zipCode}
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="account" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Account Number</Label>
                        <p className="font-mono font-medium">{selectedUser.accountNumber}</p>
                      </div>
                      <div>
                        <Label>Account Status</Label>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(selectedUser.accountStatus)}>
                            {selectedUser.accountStatus}
                          </Badge>
                          <Select
                            value={selectedUser.accountStatus}
                            onValueChange={(value) => updateUserStatus(selectedUser.id, value as User["accountStatus"])}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="verified">Verified</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                              <SelectItem value="locked">Locked</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Checking Balance</Label>
                        <p className="font-medium">{formatCurrency(selectedUser.checkingBalance)}</p>
                      </div>
                      <div>
                        <Label>Available Checking</Label>
                        <p className="font-medium text-green-600">
                          {formatCurrency(selectedUser.availableCheckingBalance)}
                        </p>
                      </div>
                      <div>
                        <Label>Savings Balance</Label>
                        <p className="font-medium">{formatCurrency(selectedUser.savingsBalance)}</p>
                      </div>
                      <div>
                        <Label>Available Savings</Label>
                        <p className="font-medium text-green-600">
                          {formatCurrency(selectedUser.availableSavingsBalance)}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="verification" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Verification Status</Label>
                        <div className="flex items-center space-x-2">
                          <Badge className={getVerificationColor(selectedUser.verificationStatus)}>
                            {selectedUser.verificationStatus.replace("_", " ")}
                          </Badge>
                          <Select
                            value={selectedUser.verificationStatus}
                            onValueChange={(value) =>
                              updateVerificationStatus(selectedUser.id, value as User["verificationStatus"])
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="selfie_required">Selfie Required</SelectItem>
                              <SelectItem value="documents_required">Documents Required</SelectItem>
                              <SelectItem value="verified">Verified</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>KYC Completed</Label>
                        <p className="font-medium">{selectedUser.kycCompleted ? "Yes" : "No"}</p>
                      </div>
                    </div>
                    {selectedUser.selfieUrl && (
                      <div>
                        <Label>Selfie Verification</Label>
                        <img
                          src={selectedUser.selfieUrl || "/placeholder.svg"}
                          alt="User selfie"
                          className="max-w-full h-auto w-32 h-32 object-cover rounded-lg border mt-2"
                        />
                      </div>
                    )}
                    {selectedUser.licenseUrl && (
                      <div>
                        <Label>Driver's License</Label>
                        <div className="mt-2 space-y-2">
                          <img
                            src={selectedUser.licenseUrl || "/placeholder.svg"}
                            alt="Driver's license"
                            className="max-w-full h-auto w-64 h-40 object-contain border rounded-lg"
                          />
                          <div className="text-sm text-gray-600">
                            <p>License #: {selectedUser.licenseNumber}</p>
                            <p>State: {selectedUser.licenseState}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="transactions" className="space-y-4">
                    <div className="max-h-96 overflow-y-auto">
                      {transactions
                        .filter((txn) => txn.userId === selectedUser.id)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((transaction) => (
                          <div key={transaction.id} className="flex justify-between items-center p-3 border rounded">
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                              <Badge variant="secondary" className="text-xs">
                                {transaction.category}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-semibold ${
                                  transaction.type === "credit" ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {transaction.type === "credit" ? "+" : "-"}
                                {formatCurrency(transaction.amount)}
                              </p>
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
                        ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Edit User Dialog */}
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User Information</DialogTitle>
              <DialogDescription>Update user's personal information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-first-name">First Name</Label>
                  <Input
                    id="edit-first-name"
                    value={editUserData.firstName || ""}
                    onChange={(e) => setEditUserData((prev) => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-last-name">Last Name</Label>
                  <Input
                    id="edit-last-name"
                    value={editUserData.lastName || ""}
                    onChange={(e) => setEditUserData((prev) => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={editUserData.email || ""}
                  onChange={(e) => setEditUserData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editUserData.phone || ""}
                  onChange={(e) => setEditUserData((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={editUserData.address || ""}
                  onChange={(e) => setEditUserData((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    value={editUserData.city || ""}
                    onChange={(e) => setEditUserData((prev) => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-state">State</Label>
                  <Input
                    id="edit-state"
                    value={editUserData.state || ""}
                    onChange={(e) => setEditUserData((prev) => ({ ...prev, state: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-zip-code">ZIP Code</Label>
                  <Input
                    id="edit-zip-code"
                    value={editUserData.zipCode || ""}
                    onChange={(e) => setEditUserData((prev) => ({ ...prev, zipCode: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleEditUser} className="w-full">
                Update User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
