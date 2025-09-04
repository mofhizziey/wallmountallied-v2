"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DataStore, type User, type Transaction } from "@/lib/data-store"
import {
  LogOut,
  Users,
  CreditCard,
  ArrowLeftRight,
  Plus,
  BarChart3,
  Edit,
  Lock,
  Unlock,
  DollarSign,
  UserCheck,
  Activity,
} from "lucide-react"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [activeTab, setActiveTab] = useState("overview")

  // Login form state
  const [loginForm, setLoginForm] = useState({ username: "", password: "" })
  const [loginError, setLoginError] = useState("")

  // User management state
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<User>>({})

  // Transaction management state
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("")
  const [createTransactionForm, setCreateTransactionForm] = useState({
    userId: "",
    type: "deposit" as const,
    amount: "",
    description: "",
    category: "other" as const,
  })
  const [transferForm, setTransferForm] = useState({
    fromUserId: "",
    toUserId: "",
    amount: "",
    description: "",
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    const dataStore = DataStore.getInstance()
    const authenticated = dataStore.isAdminAuthenticated()
    setIsAuthenticated(authenticated)

    if (authenticated) {
      await loadData()
    }
    setIsLoading(false)
  }

  const loadData = async () => {
    try {
      const dataStore = DataStore.getInstance()
      const [usersData, transactionsData] = await Promise.all([
        dataStore.getAllUsersAPI(),
        dataStore.getAllTransactionsAPI(),
      ])
      setUsers(usersData)
      setTransactions(transactionsData)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    try {
      const dataStore = DataStore.getInstance()
      const success = await dataStore.authenticateAdmin(loginForm.username, loginForm.password)

      if (success) {
        setIsAuthenticated(true)
        await loadData()
      } else {
        setLoginError("Invalid credentials")
      }
    } catch (error) {
      setLoginError("Login failed")
    }
  }

  const handleLogout = () => {
    const dataStore = DataStore.getInstance()
    dataStore.signOutAdmin()
    setIsAuthenticated(false)
    setLoginForm({ username: "", password: "" })
  }

  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.accountNumber.includes(userSearchTerm),
  )

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      checkingBalance: user.checkingBalance,
      savingsBalance: user.savingsBalance,
      accountStatus: user.accountStatus,
      isActive: user.isActive,
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveUser = async () => {
    if (!selectedUser) return

    try {
      const dataStore = DataStore.getInstance()
      const updatedUser = await dataStore.updateUser(selectedUser.id, editForm)

      if (updatedUser) {
        setUsers(users.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
        setIsEditDialogOpen(false)
        setSelectedUser(null)
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const handleLockUser = async (user: User) => {
    try {
      const dataStore = DataStore.getInstance()
      const updatedUser = await dataStore.lockUserAccount(user.id, "Admin action")
      if (updatedUser) {
        setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
      }
    } catch (error) {
      console.error("Error locking user:", error)
    }
  }

  const handleUnlockUser = async (user: User) => {
    try {
      const dataStore = DataStore.getInstance()
      const updatedUser = await dataStore.unlockUserAccount(user.id)
      if (updatedUser) {
        setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
      }
    } catch (error) {
      console.error("Error unlocking user:", error)
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const user = users.find((u) => u.id === transaction.userId)
    const userName = user ? `${user.firstName} ${user.lastName}` : ""
    return (
      transaction.description.toLowerCase().includes(transactionSearchTerm.toLowerCase()) ||
      userName.toLowerCase().includes(transactionSearchTerm.toLowerCase()) ||
      transaction.type.toLowerCase().includes(transactionSearchTerm.toLowerCase())
    )
  })

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const dataStore = DataStore.getInstance()
      const newTransaction = await dataStore.createTransaction({
        userId: createTransactionForm.userId,
        type: createTransactionForm.type,
        amount: Number.parseFloat(createTransactionForm.amount),
        description: createTransactionForm.description,
        category: createTransactionForm.category,
      })

      if (newTransaction) {
        setTransactions([newTransaction, ...transactions])
        setCreateTransactionForm({
          userId: "",
          type: "deposit",
          amount: "",
          description: "",
          category: "other",
        })
        await loadData() // Reload to get updated balances
      }
    } catch (error) {
      console.error("Error creating transaction:", error)
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const dataStore = DataStore.getInstance()
      const amount = Number.parseFloat(transferForm.amount)

      // Create transfer transactions
      const withdrawalTransaction = await dataStore.createTransaction({
        userId: transferForm.fromUserId,
        type: "transfer",
        amount: -amount,
        description: `Transfer to ${users.find((u) => u.id === transferForm.toUserId)?.firstName || "User"}: ${transferForm.description}`,
        category: "transfer",
      })

      const depositTransaction = await dataStore.createTransaction({
        userId: transferForm.toUserId,
        type: "transfer",
        amount: amount,
        description: `Transfer from ${users.find((u) => u.id === transferForm.fromUserId)?.firstName || "User"}: ${transferForm.description}`,
        category: "transfer",
      })

      if (withdrawalTransaction && depositTransaction) {
        setTransactions([depositTransaction, withdrawalTransaction, ...transactions])
        setTransferForm({
          fromUserId: "",
          toUserId: "",
          amount: "",
          description: "",
        })
        await loadData() // Reload to get updated balances
      }
    } catch (error) {
      console.error("Error transferring funds:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getStatusBadge = (user: User) => {
    if (!user.isActive) return <Badge variant="destructive">Inactive</Badge>
    if (user.accountStatus === "locked") return <Badge variant="destructive">Locked</Badge>
    if (user.accountStatus === "suspended") return <Badge variant="secondary">Suspended</Badge>
    if (user.accountStatus === "verified") return <Badge variant="default">Active</Badge>
    return <Badge variant="outline">Pending</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const totalUsers = users.length
  const activeUsers = users.filter((user) => user.isActive && user.accountStatus === "verified").length
  const totalBalance = users.reduce((sum, user) => sum + user.checkingBalance + user.savingsBalance, 0)
  const totalTransactions = transactions.length
  const recentTransactions = transactions.slice(0, 5)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the banking admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              {loginError && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{loginError}</div>}
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold">Banking Admin Dashboard</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="create-transaction" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Transaction
            </TabsTrigger>
            <TabsTrigger value="transfer" className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Transfer Funds
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalUsers}</div>
                  <p className="text-xs text-muted-foreground">{activeUsers} active users</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                  <p className="text-xs text-muted-foreground">Across all accounts</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {((activeUsers / totalUsers) * 100).toFixed(1)}% of total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTransactions}</div>
                  <p className="text-xs text-muted-foreground">All time transactions</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest 5 transactions across the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => {
                    const user = users.find((u) => u.id === transaction.userId)
                    return (
                      <div key={transaction.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user ? `${user.firstName} ${user.lastName}` : "Unknown User"}</p>
                          <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${transaction.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {transaction.amount >= 0 ? "+" : ""}
                            {formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground">{formatDate(transaction.timestamp)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all user accounts, balances, and account status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Account Number</TableHead>
                          <TableHead>Checking Balance</TableHead>
                          <TableHead>Savings Balance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.accountNumber}</TableCell>
                            <TableCell>{formatCurrency(user.checkingBalance)}</TableCell>
                            <TableCell>{formatCurrency(user.savingsBalance)}</TableCell>
                            <TableCell>{getStatusBadge(user)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {user.accountStatus === "locked" ? (
                                  <Button variant="outline" size="sm" onClick={() => handleUnlockUser(user)}>
                                    <Unlock className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button variant="outline" size="sm" onClick={() => handleLockUser(user)}>
                                    <Lock className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>View all transactions across the banking system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search transactions..."
                      value={transactionSearchTerm}
                      onChange={(e) => setTransactionSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((transaction) => {
                          const user = users.find((u) => u.id === transaction.userId)
                          return (
                            <TableRow key={transaction.id}>
                              <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                              <TableCell>{user ? `${user.firstName} ${user.lastName}` : "Unknown User"}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {transaction.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className={transaction.amount >= 0 ? "text-green-600" : "text-red-600"}>
                                  {transaction.amount >= 0 ? "+" : ""}
                                  {formatCurrency(transaction.amount)}
                                </span>
                              </TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="capitalize">
                                  {transaction.category}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Transaction Tab */}
          <TabsContent value="create-transaction" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Transaction</CardTitle>
                <CardDescription>Create deposits, withdrawals, or other transactions for users</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTransaction} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="userId">User</Label>
                      <Select
                        value={createTransactionForm.userId}
                        onValueChange={(value) => setCreateTransactionForm({ ...createTransactionForm, userId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Transaction Type</Label>
                      <Select
                        value={createTransactionForm.type}
                        onValueChange={(value: any) =>
                          setCreateTransactionForm({ ...createTransactionForm, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deposit">Deposit</SelectItem>
                          <SelectItem value="withdrawal">Withdrawal</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                          <SelectItem value="debit">Debit</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={createTransactionForm.amount}
                        onChange={(e) => setCreateTransactionForm({ ...createTransactionForm, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={createTransactionForm.category}
                        onValueChange={(value: any) =>
                          setCreateTransactionForm({ ...createTransactionForm, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="transport">Transport</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="shopping">Shopping</SelectItem>
                          <SelectItem value="bills">Bills</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Transaction description..."
                      value={createTransactionForm.description}
                      onChange={(e) =>
                        setCreateTransactionForm({ ...createTransactionForm, description: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Transaction
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transfer Funds Tab */}
          <TabsContent value="transfer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transfer Funds</CardTitle>
                <CardDescription>Transfer money between user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromUserId">From User</Label>
                      <Select
                        value={transferForm.fromUserId}
                        onValueChange={(value) => setTransferForm({ ...transferForm, fromUserId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sender" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({formatCurrency(user.checkingBalance)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toUserId">To User</Label>
                      <Select
                        value={transferForm.toUserId}
                        onValueChange={(value) => setTransferForm({ ...transferForm, toUserId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select recipient" />
                        </SelectTrigger>
                        <SelectContent>
                          {users
                            .filter((user) => user.id !== transferForm.fromUserId)
                            .map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName} ({user.email})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferAmount">Amount</Label>
                    <Input
                      id="transferAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transferDescription">Description</Label>
                    <Textarea
                      id="transferDescription"
                      placeholder="Transfer description..."
                      value={transferForm.description}
                      onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Transfer Funds
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user account details and balances</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkingBalance">Checking Balance</Label>
                  <Input
                    id="checkingBalance"
                    type="number"
                    step="0.01"
                    value={editForm.checkingBalance || 0}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        checkingBalance: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="savingsBalance">Savings Balance</Label>
                  <Input
                    id="savingsBalance"
                    type="number"
                    step="0.01"
                    value={editForm.savingsBalance || 0}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        savingsBalance: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountStatus">Account Status</Label>
                <Select
                  value={editForm.accountStatus || "pending"}
                  onValueChange={(value) =>
                    setEditForm({
                      ...editForm,
                      accountStatus: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveUser}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
