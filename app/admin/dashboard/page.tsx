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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DataStore, type User } from "@/lib/data-store"

export default function AdminDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    // Check admin authentication
    const isAdminAuthenticated = localStorage.getItem("isAdminAuthenticated")
    if (!isAdminAuthenticated) {
      router.push("/admin")
      return
    }

    loadUsers()
  }, [router])

  useEffect(() => {
    // Filter users based on search and status
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

    setFilteredUsers(filtered)
  }, [users, searchTerm, statusFilter])

  const loadUsers = () => {
    const dataStore = DataStore.getInstance()
    const allUsers = dataStore.getAllUsers()
    setUsers(allUsers)
  }

  const updateUserStatus = (userId: string, newStatus: User["accountStatus"]) => {
    const dataStore = DataStore.getInstance()
    const updatedUser = dataStore.updateUser(userId, {
      accountStatus: newStatus,
      // If verifying, also update available balances
      ...(newStatus === "verified" && {
        availableCheckingBalance: dataStore.getUserById(userId)?.checkingBalance || 0,
        availableSavingsBalance: dataStore.getUserById(userId)?.savingsBalance || 0,
        verificationStatus: "verified",
        kycCompleted: true,
      }),
    })

    if (updatedUser) {
      loadUsers()
      toast({
        title: "User Status Updated",
        description: `User account status changed to ${newStatus}`,
      })
    }
  }

  const updateVerificationStatus = (userId: string, newStatus: User["verificationStatus"]) => {
    const dataStore = DataStore.getInstance()
    const updatedUser = dataStore.updateUser(userId, { verificationStatus: newStatus })

    if (updatedUser) {
      loadUsers()
      toast({
        title: "Verification Status Updated",
        description: `User verification status changed to ${newStatus}`,
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
    totalDeposits: users.reduce((sum, u) => sum + u.checkingBalance + u.savingsBalance, 0),
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
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
            <div className="flex justify-between items-center">
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
            <div className="flex space-x-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">User</th>
                    <th className="text-left py-3 px-4 font-medium">Account</th>
                    <th className="text-left py-3 px-4 font-medium">Balances</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Verification</th>
                    <th className="text-left py-3 px-4 font-medium">Created</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-mono text-sm">****{user.accountNumber.slice(-4)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p>Checking: {formatCurrency(user.checkingBalance)}</p>
                          <p>Available: {formatCurrency(user.availableCheckingBalance)}</p>
                          <p className="text-gray-600">Savings: {formatCurrency(user.savingsBalance)}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(user.accountStatus)}>{user.accountStatus}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getVerificationColor(user.verificationStatus)}>
                          {user.verificationStatus.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                            <Eye className="h-3 w-3" />
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
                          {user.accountStatus === "verified" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateUserStatus(user.id, "suspended")}
                            >
                              Suspend
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

        {/* User Detail Modal */}
        {selectedUser && (
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
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="personal">Personal Info</TabsTrigger>
                    <TabsTrigger value="account">Account Details</TabsTrigger>
                    <TabsTrigger value="verification">Verification</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4">
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
                    <div className="grid grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-2 gap-4">
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
                          className="w-32 h-32 object-cover rounded-lg border mt-2"
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
                            className="w-64 h-40 object-contain border rounded-lg"
                          />
                          <div className="text-sm text-gray-600">
                            <p>License #: {selectedUser.licenseNumber}</p>
                            <p>State: {selectedUser.licenseState}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <Label>Created At</Label>
                      <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                    {selectedUser.lastLogin && (
                      <div>
                        <Label>Last Login</Label>
                        <p className="font-medium">{formatDate(selectedUser.lastLogin)}</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
