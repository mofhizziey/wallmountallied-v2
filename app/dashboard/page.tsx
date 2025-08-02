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
}

export default function DashboardPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    const currentUserId = localStorage.getItem("currentUserId")

    if (!isAuthenticated || !currentUserId) {
      router.push("/login")
      return
    }

    const dataStore = DataStore.getInstance()
    const user = dataStore.getUserById(currentUserId)

    if (!user) {
      router.push("/login")
      return
    }

    // Condition to prevent viewing dashboard if account is suspended or locked
    if (user.accountStatus === "suspended" || user.accountStatus === "locked") {
      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("currentUserId")
      toast({
        title: "Account Restricted",
        description: `Your account has been ${user.accountStatus}. Please contact support.`,
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    setUserData(user)
    // Load actual transactions from DataStore
    const userTransactions = dataStore.getTransactionsByUserId(currentUserId)
    setTransactions(
      userTransactions.map((txn) => ({
        id: txn.id,
        type: txn.type,
        amount: txn.amount,
        description: txn.description,
        date: txn.date,
        category: txn.category,
      })),
    )
  }, [router, toast])

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

  const isAccountRestricted = userData.accountStatus !== "verified" || userData.availableCheckingBalance === 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {" "}
          {/* Responsive layout */}
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
              {userData.verificationStatus === "documents_required" &&
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
              <div className="text-2xl font-bold">{formatCurrency(userData.checkingBalance)}</div>
              <p className="text-xs text-muted-foreground">
                Available: {formatCurrency(userData.availableCheckingBalance)}
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
              <div className="text-2xl font-bold">{formatCurrency(userData.savingsBalance)}</div>
              <p className="text-xs text-muted-foreground">
                Available: {formatCurrency(userData.availableSavingsBalance)}
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
              <div className="text-2xl font-bold capitalize">{userData.accountStatus}</div>
              <p className="text-xs text-muted-foreground">
                Verification: {userData.verificationStatus.replace("_", " ")}
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
                {formatCurrency(userData.checkingBalance + userData.savingsBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Available: {formatCurrency(userData.availableCheckingBalance + userData.availableSavingsBalance)}
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

        {/* Recent Transactions */}
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
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
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
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${transaction.type === "credit" ? "text-green-600" : "text-red-600"}`}
                      >
                        {transaction.type === "credit" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <Badge variant="secondary" className="text-xs">
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
