"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, PiggyBank, TrendingUp, Download, Eye, EyeOff, Copy, AlertTriangle } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataStore, type User } from "@/lib/data-store"
import { useToast } from "@/hooks/use-toast"

export default function AccountsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<User | null>(null)
  const [showAccountNumbers, setShowAccountNumbers] = useState(false)

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

    setUserData(user)
  }, [router])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Account number copied to clipboard",
    })
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your accounts...</p>
        </div>
      </div>
    )
  }

  const accounts = [
    {
      id: "checking",
      name: "Primary Checking",
      type: "Checking",
      accountNumber: userData.accountNumber,
      balance: userData.checkingBalance,
      availableBalance: userData.availableCheckingBalance,
      icon: CreditCard,
      color: "bg-blue-500",
    },
    {
      id: "savings",
      name: "High Yield Savings",
      type: "Savings",
      accountNumber: (Number.parseInt(userData.accountNumber) + 1).toString(),
      balance: userData.savingsBalance,
      availableBalance: userData.availableSavingsBalance,
      icon: PiggyBank,
      color: "bg-green-500",
      apy: 2.5,
    },
  ]

  const isAccountRestricted = userData.accountStatus !== "verified"

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Accounts</h1>
            <p className="text-gray-600">View and manage your banking accounts</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowAccountNumbers(!showAccountNumbers)}>
              {showAccountNumbers ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showAccountNumbers ? "Hide" : "Show"} Account Numbers
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download Statements
            </Button>
          </div>
        </div>

        {/* Account Status Alert */}
        {isAccountRestricted && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Your account is pending verification. Available balances will be updated once your identity is verified.
            </AlertDescription>
          </Alert>
        )}

        {/* Account Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map((account) => {
            const IconComponent = account.icon
            return (
              <Card key={account.id} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-2 ${account.color}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${account.color} bg-opacity-10`}>
                        <IconComponent
                          className={`h-5 w-5`}
                          style={{
                            color:
                              account.color.replace("bg-", "").replace("-500", "") === "blue" ? "#3b82f6" : "#10b981",
                          }}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{account.name}</CardTitle>
                        <CardDescription>{account.type} Account</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">{account.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Balance</p>
                    <p className="text-3xl font-bold">{formatCurrency(account.balance)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Available Balance</p>
                    <p
                      className={`text-lg font-semibold ${account.availableBalance > 0 ? "text-green-600" : "text-gray-500"}`}
                    >
                      {formatCurrency(account.availableBalance)}
                    </p>
                    {account.availableBalance === 0 && account.balance > 0 && (
                      <p className="text-xs text-yellow-600">Pending verification</p>
                    )}
                  </div>

                  {account.apy && (
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">{account.apy}% APY</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Account Number</p>
                      <p className="font-mono text-sm">
                        {showAccountNumbers ? account.accountNumber : `****${account.accountNumber?.slice(-4)}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(account.accountNumber)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Account Details Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Detailed information and recent activity for your accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="checking" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="checking">Checking Account</TabsTrigger>
                <TabsTrigger value="savings">Savings Account</TabsTrigger>
              </TabsList>

              <TabsContent value="checking" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600">Account Type</p>
                    <p className="font-semibold">Premium Checking</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600">Monthly Fee</p>
                    <p className="font-semibold">$0.00</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600">Overdraft Protection</p>
                    <p className="font-semibold text-green-600">Available</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Account Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• No monthly maintenance fee</li>
                    <li>• Free online and mobile banking</li>
                    <li>• Free ATM withdrawals at network ATMs</li>
                    <li>• Mobile check deposit</li>
                    <li>• Overdraft protection available</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="savings" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600">Account Type</p>
                    <p className="font-semibold">High Yield Savings</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="font-semibold text-green-600">2.50% APY</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600">Minimum Balance</p>
                    <p className="font-semibold">$0.00</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Account Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Competitive 2.50% APY</li>
                    <li>• No monthly maintenance fee</li>
                    <li>• FDIC insured up to $250,000</li>
                    <li>• Online and mobile access</li>
                    <li>• Automatic savings programs available</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
