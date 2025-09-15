"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  CheckCircle,
  Clock,
  XCircle,
  Upload,
  Info,
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

type ModalType = "transfer" | "bills" | "statements" | "security" | "verification" | null

export default function DashboardPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [currentBalances, setCurrentBalances] = useState({
    checking: 0,
    savings: 0,
    availableChecking: 0,
    availableSavings: 0
  })
  const { toast } = useToast()

  // Form states for modals
  const [transferForm, setTransferForm] = useState({
    fromAccount: "checking",
    toAccount: "savings",
    amount: "",
    description: "",
  })
  const [billForm, setBillForm] = useState({
    payee: "",
    amount: "",
    dueDate: "",
    category: "utilities",
  })

  // Calculate current balance from transactions
  const calculateCurrentBalance = (initialBalance: number, userTransactions: any[], accountType: 'checking' | 'savings') => {
    return userTransactions.reduce((balance, transaction) => {
      // Only process transactions that affect the specific account
      // You might need to adjust this logic based on how you track which account each transaction affects
      if (transaction.type === 'deposit' || transaction.type === 'credit') {
        return balance + transaction.amount
      } else if (transaction.type === 'withdrawal' || transaction.type === 'debit' || transaction.type === 'payment') {
        return balance - transaction.amount
      }
      return balance
    }, initialBalance)
  }

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

        // Load transactions from API
        const userTransactions = await dataStore.getTransactionsByUserId(currentUserId)
        const formattedTransactions = dataStore.formatTransactionsForDashboard(userTransactions)
        
        setTransactions(formattedTransactions)

        // Calculate current balances based on transactions
        const initialCheckingBalance = user.checkingBalance || 0
        const initialSavingsBalance = user.savingsBalance || 0
        
        // Calculate real-time balances from transaction history
        const currentCheckingBalance = calculateCurrentBalance(initialCheckingBalance, userTransactions, 'checking')
        const currentSavingsBalance = calculateCurrentBalance(initialSavingsBalance, userTransactions, 'savings')
        
        // Available balance might have holds or pending transactions
        // For now, we'll assume available = current balance, but this could be calculated differently
        const availableCheckingBalance = user.availableCheckingBalance !== undefined 
          ? calculateCurrentBalance(user.availableCheckingBalance, userTransactions, 'checking')
          : currentCheckingBalance
        const availableSavingsBalance = user.availableSavingsBalance !== undefined 
          ? calculateCurrentBalance(user.availableSavingsBalance, userTransactions, 'savings')
          : currentSavingsBalance

        setCurrentBalances({
          checking: currentCheckingBalance,
          savings: currentSavingsBalance,
          availableChecking: availableCheckingBalance,
          availableSavings: availableSavingsBalance
        })

        // If no transactions exist, create some sample ones for demo
        if (formattedTransactions.length === 0) {
          const sampleTransactions = [
            {
              id: 'sample-1',
              type: 'credit' as const,
              description: 'Welcome Bonus',
              amount: 100.00,
              date: new Date().toLocaleDateString(),
              category: 'bonus',
              status: 'completed'
            },
            {
              id: 'sample-2',
              type: 'debit' as const,
              description: 'ATM Withdrawal',
              amount: 50.00,
              date: new Date(Date.now() - 86400000).toLocaleDateString(), // Yesterday
              category: 'cash',
              status: 'completed'
            }
          ]
          setTransactions(sampleTransactions)
          
          // Update balances with sample transactions
          const sampleCheckingBalance = initialCheckingBalance + 100.00 - 50.00
          setCurrentBalances({
            checking: sampleCheckingBalance,
            savings: initialSavingsBalance,
            availableChecking: sampleCheckingBalance,
            availableSavings: initialSavingsBalance
          })
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error)
        setError('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [router, toast])

  const getVerificationStatusInfo = (status: string) => {
    switch (status) {
      case "verified":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          message: "Your identity has been verified. You have full access to all banking features.",
          actionText: null
        }
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          message: "Your documents are being reviewed. This typically takes 1-2 business days. Some features may be limited.",
          actionText: "Check Status"
        }
      case "documents_required":
        return {
          icon: Upload,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          message: "Please upload required documents to verify your identity and unlock all features.",
          actionText: "Upload Documents"
        }
      case "rejected":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          message: "Document verification failed. Please resubmit clear, valid documents or contact support.",
          actionText: "Resubmit Documents"
        }
      default:
        return {
          icon: Info,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          message: "Complete identity verification to access all banking features.",
          actionText: "Start Verification"
        }
    }
  }

  const handleQuickAction = (action: ModalType) => {
    if (userData && isAccountRestricted && (action === "transfer" || action === "bills")) {
      toast({
        title: "Action Restricted",
        description: "Please complete identity verification to access this feature.",
        variant: "destructive",
      })
      return
    }
    setActiveModal(action)
  }

  const handleTransferSubmit = async () => {
    if (!userData) return
    
    try {
      const dataStore = DataStore.getInstance()
      
      // Create a transaction record for the transfer
      const transferData = {
        userId: userData.id,
        type: 'transfer' as const,
        amount: parseFloat(transferForm.amount),
        description: transferForm.description || `Transfer from ${transferForm.fromAccount} to ${transferForm.toAccount}`,
        category: 'transfer',
        fromAccount: transferForm.fromAccount,
        toAccount: transferForm.toAccount
      }
      
      const result = await dataStore.createTransaction(transferData)
      
      if (result.success) {
        toast({
          title: "Transfer Completed",
          description: `$${transferForm.amount} transferred from ${transferForm.fromAccount} to ${transferForm.toAccount}.`,
        })
        
        // Refresh the page to show updated balances and transactions
        window.location.reload()
      } else {
        toast({
          title: "Transfer Failed",
          description: result.error || "Failed to process transfer",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Transfer Failed",
        description: "An error occurred while processing the transfer",
        variant: "destructive",
      })
    }
    
    setActiveModal(null)
    setTransferForm({ fromAccount: "checking", toAccount: "savings", amount: "", description: "" })
  }

  const handleBillPaymentSubmit = async () => {
    if (!userData) return
    
    try {
      const dataStore = DataStore.getInstance()
      
      // Create a transaction record for the bill payment
      const paymentData = {
        userId: userData.id,
        type: 'payment' as const,
        amount: parseFloat(billForm.amount),
        description: `Bill payment to ${billForm.payee}`,
        category: billForm.category,
      }
      
      const result = await dataStore.createTransaction(paymentData)
      
      if (result.success) {
        toast({
          title: "Bill Payment Scheduled",
          description: `Payment of $${billForm.amount} to ${billForm.payee} has been processed.`,
        })
        
        // Refresh the page to show updated balances and transactions
        window.location.reload()
      } else {
        toast({
          title: "Payment Failed",
          description: result.error || "Failed to process payment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "An error occurred while processing the payment",
        variant: "destructive",
      })
    }
    
    setActiveModal(null)
    setBillForm({ payee: "", amount: "", dueDate: "", category: "utilities" })
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

  // Use calculated current balances instead of static user data
  const checkingBalance = currentBalances.checking
  const savingsBalance = currentBalances.savings
  const availableCheckingBalance = currentBalances.availableChecking
  const availableSavingsBalance = currentBalances.availableSavings
  const accountStatus = userData.accountStatus || "active"
  const verificationStatus = userData.verificationStatus || "verified"

  const isAccountRestricted = verificationStatus !== "verified"
  const verificationInfo = getVerificationStatusInfo(verificationStatus)
  const VerificationIcon = verificationInfo.icon

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

        {/* Verification Status Alert */}
        {verificationStatus !== "verified" && (
          <Alert className={`${verificationInfo.borderColor} ${verificationInfo.bgColor}`}>
            <VerificationIcon className={`h-4 w-4 ${verificationInfo.color}`} />
            <AlertDescription className={verificationInfo.color}>
              {verificationInfo.message}
              {verificationInfo.actionText && (
                <Button
                  variant="link"
                  className={`p-0 ml-2 ${verificationInfo.color} underline`}
                  onClick={() => setActiveModal("verification")}
                >
                  {verificationInfo.actionText}
                </Button>
              )}
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
        
        
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your accounts with these common actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col bg-transparent relative" 
                onClick={() => handleQuickAction("transfer")}
                disabled={isAccountRestricted}
              >
                <ArrowUpRight className="h-6 w-6 mb-2" />
                Transfer Money
                {isAccountRestricted && (
                  <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs px-1">
                    Locked
                  </Badge>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col bg-transparent relative" 
                onClick={() => handleQuickAction("bills")}
                disabled={isAccountRestricted}
              >
                <DollarSign className="h-6 w-6 mb-2" />
                Pay Bills
                {isAccountRestricted && (
                  <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs px-1">
                    Locked
                  </Badge>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col bg-transparent" 
                onClick={() => handleQuickAction("statements")}
              >
                <CreditCard className="h-6 w-6 mb-2" />
                View Statements
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col bg-transparent" 
                onClick={() => handleQuickAction("security")}
              >
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

        {/* Modals */}
        {/* Transfer Money Modal */}
        <Dialog open={activeModal === "transfer"} onOpenChange={() => setActiveModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer Money</DialogTitle>
              <DialogDescription>
                Transfer funds between your accounts
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromAccount">From Account</Label>
                  <Select value={transferForm.fromAccount} onValueChange={(value) => 
                    setTransferForm({...transferForm, fromAccount: value})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking ({formatCurrency(checkingBalance)})</SelectItem>
                      <SelectItem value="savings">Savings ({formatCurrency(savingsBalance)})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="toAccount">To Account</Label>
                  <Select value={transferForm.toAccount} onValueChange={(value) => 
                    setTransferForm({...transferForm, toAccount: value})
                  }>
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
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  placeholder="0.00"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="What's this transfer for?"
                  value={transferForm.description}
                  onChange={(e) => setTransferForm({...transferForm, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button onClick={handleTransferSubmit} disabled={!transferForm.amount}>
                Transfer ${transferForm.amount || "0.00"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pay Bills Modal */}
        <Dialog open={activeModal === "bills"} onOpenChange={() => setActiveModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pay Bills</DialogTitle>
              <DialogDescription>
                Schedule or pay your bills
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="payee">Payee</Label>
                <Input
                  id="payee"
                  placeholder="Enter payee name"
                  value={billForm.payee}
                  onChange={(e) => setBillForm({...billForm, payee: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billAmount">Amount</Label>
                  <Input
                    id="billAmount"
                    placeholder="0.00"
                    value={billForm.amount}
                    onChange={(e) => setBillForm({...billForm, amount: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={billForm.dueDate}
                    onChange={(e) => setBillForm({...billForm, dueDate: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={billForm.category} onValueChange={(value) => 
                  setBillForm({...billForm, category: value})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="rent">Rent/Mortgage</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button onClick={handleBillPaymentSubmit} disabled={!billForm.payee || !billForm.amount}>
                Schedule Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Statements Modal */}
        <Dialog open={activeModal === "statements"} onOpenChange={() => setActiveModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Account Statements</DialogTitle>
              <DialogDescription>
                View and download your account statements
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No statements available yet</p>
                <p className="text-sm text-gray-500">
                  Statements will be available at the end of each month.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setActiveModal(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Security Settings Modal */}
        <Dialog open={activeModal === "security"} onOpenChange={() => setActiveModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Security Settings</DialogTitle>
              <DialogDescription>
                Manage your account security preferences
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Enable Two-Factor Authentication
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Freeze/Unfreeze Account
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="h-4 w-4 mr-2" />
                  Notification Preferences
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setActiveModal(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Verification Modal */}
        <Dialog open={activeModal === "verification"} onOpenChange={() => setActiveModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Identity Verification</DialogTitle>
              <DialogDescription>
                Complete your identity verification to unlock all features
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${verificationInfo.bgColor} ${verificationInfo.borderColor} border`}>
                <div className="flex items-center gap-2 mb-2">
                  <VerificationIcon className={`h-5 w-5 ${verificationInfo.color}`} />
                  <span className={`font-medium ${verificationInfo.color}`}>
                    Current Status: {verificationStatus.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <p className={`text-sm ${verificationInfo.color}`}>
                  {verificationInfo.message}
                </p>
              </div>
              
              {verificationStatus === "documents_required" && (
                <div className="space-y-3">
                  <h4 className="font-medium">Required Documents:</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      Government-issued photo ID (Driver's License, Passport, etc.)
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      Proof of address (Utility bill, Bank statement, etc.)
                    </div>
                  </div>
                  <Button className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActiveModal(null)}>
                Close
              </Button>
              {verificationStatus !== "verified" && verificationStatus !== "pending" && (
                <Button>
                  Start Verification
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}