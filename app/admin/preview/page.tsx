"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  PiggyBank,
  Shield,
  Bell,
  AlertTriangle,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataStore, type User } from "@/lib/data-store"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
  id: string
  type: "credit" | "debit"
  amount: number
  description: string
  date: string
  category: string
  status: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true)
      try {
        const isAuthenticated = localStorage.getItem("isAuthenticated")
        const currentUserId = localStorage.getItem("currentUserId")

        if (!isAuthenticated || !currentUserId) {
          router.push("/login")
          return
        }

        const dataStore = DataStore.getInstance()
        
        // Load user data from API
        const result = await dataStore.getUserById(currentUserId)
        
        if (!result.success || !result.user) {
          console.error('Failed to load user data:', result.error)
          dataStore.signOut()
          router.push("/login")
          return
        }

        const user = result.user

        // Condition to prevent viewing dashboard if account is suspended or locked
        if (user.accountStatus === "suspended" || user.accountStatus === "locked") {
          dataStore.signOut()
          toast({
            title: "Account Restricted",
            description: `Your account has been ${user.accountStatus}. Please contact support.`,
            variant: "destructive",
          })
          router.push("/login")
          return
        }

        setUserData(user)

        // Load transactions from API - ONLY real data, no dummy transactions
        const userTransactions = await dataStore.getTransactionsByUserId(currentUserId)
        const formattedTransactions = dataStore.formatTransactionsForDashboard(userTransactions)
        
        setTransactions(formattedTransactions)

      } catch (error) {
        console.error('Error loading dashboard data:', error)
        setError('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [router, toast])

  // Helper function to create transactions (for testing purposes only)
  const createTransaction = async (type: 'deposit' | 'withdrawal', amount: number, description: string) => {
    const currentUserId = localStorage.getItem("currentUserId")
    if (!currentUserId) return

    const dataStore = DataStore.getInstance()
    const result = await dataStore.createTransaction({
      userId: currentUserId,
      type,
      amount,
      description,
      category: 'general'
    })

    if (result.success) {
      // Reload transactions
      const userTransactions = await dataStore.getTransactionsByUserId(currentUserId)
      const formattedTransactions = dataStore.formatTransactionsForDashboard(userTransactions)
      setTransactions(formattedTransactions)
      
      // Update user balance
      if (userData && result.newBalance !== undefined) {
        setUserData({
          ...userData,
          checkingBalance: result.newBalance
        })
      }

      toast({
        title: "Transaction Created",
        description: `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} of ${amount} completed successfully.`,
      })
    } else {
      toast({
        title: "Transaction Failed",
        description: result.error || "Failed to create transaction",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your account...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your account...</p>
        </div>
      </div>
    )
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
    })
  }

  // Handle cases where these properties might not exist
  const checkingBalance = userData.checkingBalance || 0
  const savingsBalance = userData.savingsBalance || 0
  const availableCheckingBalance = userData.availableCheckingBalance || checkingBalance
  const availableSavingsBalance = userData.availableSavingsBalance || savingsBalance
  const accountStatus = userData.accountStatus || "active"
  const verificationStatus = userData.verificationStatus || "verified"

  const isAccountRestricted = accountStatus !== "verified" && accountStatus !== "active"

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userData.firstName}!</h1>
            <p className="text-gray-600">Here's what's happening with your accounts today.</p>
          </div>
          <Button>
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
        </div>

        {/* Account Status Alert */}
        {isAccountRestricted && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Your account is currently restricted. Funds will be available once your identity is fully verified by our
              team.
              {verificationStatus === "documents_required" &&
                " Please ensure all required documents are submitted."}
            </AlertDescription>
          </Alert>
        )}

        {/* Account Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checking Account</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(checkingBalance)}</div>
              <p className="text-xs text-muted-foreground">
                Available: {formatCurrency(availableCheckingBalance)}
              </p>
              <p className="text-xs text-muted-foreground">Account: ****{userData.accountNumber.slice(-4)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Savings Account</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(savingsBalance)}</div>
              <p className="text-xs text-muted-foreground">
                Available: {formatCurrency(availableSavingsBalance)}
              </p>
              <p className="text-xs text-muted-foreground">+2.5% APY</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{accountStatus}</div>
              <p className="text-xs text-muted-foreground">
                Verification: {verificationStatus.replace("_", " ")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(checkingBalance + savingsBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Available: {formatCurrency(availableCheckingBalance + availableSavingsBalance)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your accounts with these common actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col bg-transparent" disabled={isAccountRestricted}>
                <ArrowUpRight className="h-6 w-6 mb-2" />
                Transfer Money
              </Button>
              <Button variant="outline" className="h-20 flex-col bg-transparent" disabled={isAccountRestricted}>
                <DollarSign className="h-6 w-6 mb-2" />
                Pay Bills
              </Button>
              <Button variant="outline" className="h-20 flex-col bg-transparent">
                <CreditCard className="h-6 w-6 mb-2" />
                View Statements
              </Button>
              <Button variant="outline" className="h-20 flex-col bg-transparent">
                <Shield className="h-6 w-6 mb-2" />
                Security Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Demo Transaction Creation (for testing) - Remove in production */}
        <Card className="border-dashed border-gray-300">
          <CardHeader>
            <CardTitle className="text-sm">Demo Actions (Testing Only)</CardTitle>
            <CardDescription className="text-xs">Create sample transactions for testing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => createTransaction('deposit', 100, 'Test Deposit')}
                disabled={isAccountRestricted}
              >
                Add $100 Deposit
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => createTransaction('withdrawal', 25, 'Test Withdrawal')}
                disabled={isAccountRestricted || checkingBalance < 25}
              >
                Add $25 Withdrawal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions - Only Real Data */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest account activity</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No transactions yet</p>
                <p className="text-sm text-gray-500">
                  Your transaction history will appear here once you start using your account.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-wrap items-center justify-between p-4 border rounded-lg gap-2"
                  >
                    <div className="flex items-center space-x-4 min-w-0">
                      <div
                        className={`p-2 rounded-full ${
                          transaction.type === "credit" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        }`}
                      >
                        {transaction.type === "credit" ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end min-w-0">
                      <p
                        className={`font-semibold ${transaction.type === "credit" ? "text-green-600" : "text-red-600"} truncate`}
                      >
                        {transaction.type === "credit" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {transaction.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}