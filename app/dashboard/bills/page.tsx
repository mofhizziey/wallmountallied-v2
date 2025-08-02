"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, CreditCard, Zap, Car, Home } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { DataStore, type User, type Bill } from "@/lib/data-store"

// Map category to icon for display
const categoryIcons: { [key: string]: any } = {
  Utilities: Zap,
  Credit: CreditCard,
  Insurance: Car,
  Housing: Home,
  
  // Add more categories and icons as needed
}

export default function BillsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<User | null>(null)
  const [bills, setBills] = useState<Bill[]>([]) // Bills now fetched from DataStore
  const [paymentData, setPaymentData] = useState({
    billId: "",
    amount: "",
    paymentDate: "",
    fromAccount: "",
  })

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

    // Condition to prevent actions if account is suspended or locked
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
    // Fetch bills from DataStore for the current user
    const userBills = dataStore.getBillsByUserId(currentUserId)
    setBills(userBills)
  }, [router, toast])

  const handlePayBill = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userData) {
      toast({
        title: "Error",
        description: "User data not loaded. Please try again.",
        variant: "destructive",
      })
      return
    }

    if (!paymentData.billId || !paymentData.amount || !paymentData.fromAccount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(paymentData.amount)
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Payment amount must be greater than $0",
        variant: "destructive",
      })
      return
    }

    const bill = bills.find((b) => b.id === paymentData.billId)
    if (!bill) {
      toast({
        title: "Error",
        description: "Selected bill not found.",
        variant: "destructive",
      })
      return
    }

    const dataStore = DataStore.getInstance()
    let currentBalance: number
    let availableBalance: number

    if (paymentData.fromAccount === "checking") {
      currentBalance = userData.checkingBalance
      availableBalance = userData.availableCheckingBalance
    } else {
      currentBalance = userData.savingsBalance
      availableBalance = userData.availableSavingsBalance
    }

    // Check if user has sufficient available funds
    if (availableBalance < amount) {
      toast({
        title: "Insufficient Funds",
        description: `You only have ${formatCurrency(availableBalance)} available in your ${paymentData.fromAccount} account.`,
        variant: "destructive",
      })
      return
    }

    // Prepare user balance update
    const updatedUser: Partial<User> = { ...userData }
    if (paymentData.fromAccount === "checking") {
      updatedUser.checkingBalance = currentBalance - amount
      updatedUser.availableCheckingBalance = availableBalance - amount
    } else {
      updatedUser.savingsBalance = currentBalance - amount
      updatedUser.availableSavingsBalance = availableBalance - amount
    }

    const userUpdateResult = await dataStore.updateUser(userData.id, updatedUser)

    if (userUpdateResult) {
      setUserData(userUpdateResult) // Update local user data
      // Create transaction record
      await dataStore.createTransaction({
        userId: userData.id,
        type: "debit",
        amount: amount,
        description: `Bill payment to ${bill.company}`,
        category: bill.category,
        fromAccount: paymentData.fromAccount as "checking" | "savings",
      })

      // Update bill status in DataStore
      const billUpdateResult = await dataStore.updateBill(bill.id, { status: "paid" })

      if (billUpdateResult) {
        // Re-fetch all bills to update the list
        setBills(dataStore.getBillsByUserId(userData.id))
        toast({
          title: "Payment Successful!",
          description: `Payment of ${formatCurrency(amount)} to ${bill.company} has been processed.`,
        })
        // Reset form
        setPaymentData({
          billId: "",
          amount: "",
          paymentDate: "",
          fromAccount: "",
        })
      } else {
        toast({
          title: "Payment Failed",
          description: "Failed to update bill status. Please contact support.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Payment Failed",
        description: "An error occurred during payment. Please try again.",
        variant: "destructive",
      })
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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

  const isAccountRestricted = userData.accountStatus !== "verified" || userData.availableCheckingBalance === 0

  const pendingBills = bills.filter((bill) => bill.status === "pending")
  const paidBills = bills.filter((bill) => bill.status === "paid")
  const totalDue = pendingBills.reduce((sum, bill) => sum + bill.amount, 0)
  const totalPaidThisMonth = paidBills
    .filter((bill) => new Date(bill.dueDate).getMonth() === new Date().getMonth())
    .reduce((sum, bill) => sum + bill.amount, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bill Pay</h1>
          <p className="text-gray-600">Manage and pay your bills in one convenient location</p>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Due</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalDue)}</div>
              <p className="text-xs text-muted-foreground">{pendingBills.length} pending bills</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Due</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pendingBills.length > 0
                  ? formatDate(
                      pendingBills.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]
                        .dueDate,
                    )
                  : "None"}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingBills.length > 0
                  ? pendingBills.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]
                      .company
                  : "All bills paid"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPaidThisMonth)}</div>
              <p className="text-xs text-muted-foreground">Total bills paid</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bills List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Paid Bills</CardTitle>
              <CardDescription>Your successfully paid bills</CardDescription>
            </CardHeader>
            <CardContent>
              {paidBills.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No paid bills yet</p>
                  <p className="text-sm text-gray-500">Successfully paid bills will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paidBills.map((bill) => {
                    const IconComponent = categoryIcons[bill.category] || Home // Default icon
                    return (
                      <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <IconComponent className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{bill.company}</p>
                            <p className="text-sm text-gray-500">Due: {formatDate(bill.dueDate)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(bill.amount)}</p>
                          <Badge className={getStatusColor(bill.status)}>{bill.status}</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Pay a Bill</CardTitle>
              <CardDescription>Select a bill and make a payment</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayBill} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="billId">Select Bill</Label>
                  <Select
                    value={paymentData.billId}
                    onValueChange={(value) => {
                      const selectedBill = bills.find((b) => b.id === value)
                      setPaymentData((prev) => ({
                        ...prev,
                        billId: value,
                        amount: selectedBill ? selectedBill.amount.toString() : "",
                      }))
                    }}
                    disabled={isAccountRestricted || pendingBills.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={pendingBills.length > 0 ? "Choose a bill to pay" : "No pending bills"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingBills.map((bill) => (
                        <SelectItem key={bill.id} value={bill.id}>
                          {bill.company} - {formatCurrency(bill.amount)} (Due: {formatDate(bill.dueDate)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      className="pl-8"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData((prev) => ({ ...prev, amount: e.target.value }))}
                      disabled={isAccountRestricted || pendingBills.length === 0}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromAccount">Pay From</Label>
                  <Select
                    value={paymentData.fromAccount}
                    onValueChange={(value) => setPaymentData((prev) => ({ ...prev, fromAccount: value }))}
                    disabled={isAccountRestricted || pendingBills.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">
                        Checking - ****{userData.accountNumber.slice(-4)} ({formatCurrency(userData.checkingBalance)})
                      </SelectItem>
                      <SelectItem value="savings">
                        Savings - ****{(Number.parseInt(userData.accountNumber) + 1).toString().slice(-4)} (
                        {formatCurrency(userData.savingsBalance)})
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData((prev) => ({ ...prev, paymentDate: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                    disabled={isAccountRestricted || pendingBills.length === 0}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isAccountRestricted || pendingBills.length === 0}>
                  Pay Bill
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
