"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, Shield } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { DataStore, type User } from "@/lib/data-store" // Import User and DataStore

export default function TransferPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<User | null>(null) // Use User type
  const [transferData, setTransferData] = useState({
    fromAccount: "",
    toAccount: "",
    amount: "",
    memo: "",
    transferType: "internal",
  })

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    const currentUserId = localStorage.getItem("currentUserId") // Get current user ID

    if (!isAuthenticated || !currentUserId) {
      router.push("/login")
      return
    }

    const dataStore = DataStore.getInstance()
    const user = dataStore.getUserById(currentUserId) // Fetch user data from DataStore

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
  }, [router, toast])

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userData) {
      toast({
        title: "Error",
        description: "User data not loaded. Please try again.",
        variant: "destructive",
      })
      return
    }

    if (!transferData.fromAccount || !transferData.toAccount || !transferData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(transferData.amount)
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Transfer amount must be greater than $0",
        variant: "destructive",
      })
      return
    }

    const dataStore = DataStore.getInstance()
    const fromUser = userData // The current logged-in user
    let fromBalance: number
    let fromAvailableBalance: number
    let toBalance: number
    let toAvailableBalance: number

    if (transferData.fromAccount === "checking") {
      fromBalance = fromUser.checkingBalance
      fromAvailableBalance = fromUser.availableCheckingBalance
    } else {
      fromBalance = fromUser.savingsBalance
      fromAvailableBalance = fromUser.availableSavingsBalance
    }

    // Check if user has sufficient available funds
    if (fromAvailableBalance < amount) {
      toast({
        title: "Insufficient Funds",
        description: `You only have ${formatCurrency(fromAvailableBalance)} available in your ${transferData.fromAccount} account.`,
        variant: "destructive",
      })
      return
    }

    // Prepare updates for the sender
    const updatedFromUser: Partial<User> = { ...fromUser }
    if (transferData.fromAccount === "checking") {
      updatedFromUser.checkingBalance = fromBalance - amount
      updatedFromUser.availableCheckingBalance = fromAvailableBalance - amount
    } else {
      updatedFromUser.savingsBalance = fromBalance - amount
      updatedFromUser.availableSavingsBalance = fromAvailableBalance - amount
    }

    let toUser: User | undefined // For internal transfers, this is still the same user
    let toAccountType: "checking" | "savings" | undefined

    if (transferData.transferType === "internal") {
      toUser = fromUser // Internal transfer is to the same user
      toAccountType = transferData.toAccount as "checking" | "savings"

      if (toAccountType === "checking") {
        toBalance = toUser.checkingBalance
        toAvailableBalance = toUser.availableCheckingBalance
      } else {
        toBalance = toUser.savingsBalance
        toAvailableBalance = toUser.savingsBalance
      }

      // Prepare updates for the receiver (same user, different account)
      if (toAccountType === "checking") {
        updatedFromUser.checkingBalance = (updatedFromUser.checkingBalance || 0) + amount
        updatedFromUser.availableCheckingBalance = (updatedFromUser.availableCheckingBalance || 0) + amount
      } else {
        updatedFromUser.savingsBalance = (updatedFromUser.savingsBalance || 0) + amount
        updatedFromUser.availableSavingsBalance = (updatedFromUser.availableSavingsBalance || 0) + amount
      }

      // Create debit transaction for sender
      await dataStore.createTransaction({
        userId: fromUser.id,
        type: "debit",
        amount: amount,
        description: `Internal transfer to ${toAccountType} account: ${transferData.memo || "No memo"}`,
        category: "Transfer",
        fromAccount: transferData.fromAccount as "checking" | "savings",
        toAccount: toAccountType,
      })

      // Create credit transaction for receiver (same user)
      await dataStore.createTransaction({
        userId: fromUser.id,
        type: "credit",
        amount: amount,
        description: `Internal transfer from ${transferData.fromAccount} account: ${transferData.memo || "No memo"}`,
        category: "Transfer",
        fromAccount: toAccountType,
        toAccount: transferData.fromAccount as "checking" | "savings",
      })
    } else {
      // External or Wire Transfer: Only debit the current user
      // In a real app, external transfers would involve looking up recipient or external APIs
      // For this demo, we just debit the sender and record a transaction.
      await dataStore.createTransaction({
        userId: fromUser.id,
        type: "debit",
        amount: amount,
        description: `${transferData.transferType} transfer to ${transferData.toAccount}: ${transferData.memo || "No memo"}`,
        category: "External Transfer",
        fromAccount: transferData.fromAccount as "checking" | "savings",
        toAccount: transferData.toAccount,
      })
    }

    // Update the user in the DataStore
    const result = await dataStore.updateUser(fromUser.id, updatedFromUser)

    if (result) {
      setUserData(result) // Update local state with the new user data
      toast({
        title: "Transfer Successful!",
        description: `$${amount.toFixed(2)} has been transferred successfully.`,
      })
      // Reset form
      setTransferData({
        fromAccount: "",
        toAccount: "",
        amount: "",
        memo: "",
        transferType: "internal",
      })
    } else {
      toast({
        title: "Transfer Failed",
        description: "An error occurred during the transfer. Please try again.",
        variant: "destructive",
      })
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transfer Money</h1>
          <p className="text-gray-600">Send money between your accounts or to external recipients</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Secure Transfer
            </CardTitle>
            <CardDescription>All transfers are encrypted and monitored for security</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransfer} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transferType">Transfer Type</Label>
                  <Select
                    value={transferData.transferType}
                    onValueChange={(value) => setTransferData((prev) => ({ ...prev, transferType: value }))}
                    disabled={isAccountRestricted}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Between My Accounts</SelectItem>
                      <SelectItem value="external">To Another Person</SelectItem>
                      <SelectItem value="wire">Wire Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromAccount">From Account</Label>
                    <Select
                      value={transferData.fromAccount}
                      onValueChange={(value) => setTransferData((prev) => ({ ...prev, fromAccount: value }))}
                      disabled={isAccountRestricted}
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
                    <Label htmlFor="toAccount">
                      {transferData.transferType === "internal" ? "To Account" : "Recipient Account"}
                    </Label>
                    {transferData.transferType === "internal" ? (
                      <Select
                        value={transferData.toAccount}
                        onValueChange={(value) => setTransferData((prev) => ({ ...prev, toAccount: value }))}
                        disabled={isAccountRestricted}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {transferData.fromAccount !== "savings" && (
                            <SelectItem value="savings">
                              Savings - ****{(Number.parseInt(userData.accountNumber) + 1).toString().slice(-4)}
                            </SelectItem>
                          )}
                          {transferData.fromAccount !== "checking" && (
                            <SelectItem value="checking">Checking - ****{userData.accountNumber.slice(-4)}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Enter account number or email"
                        value={transferData.toAccount}
                        onChange={(e) => setTransferData((prev) => ({ ...prev, toAccount: e.target.value }))}
                        disabled={isAccountRestricted}
                      />
                    )}
                  </div>
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
                      value={transferData.amount}
                      onChange={(e) => setTransferData((prev) => ({ ...prev, amount: e.target.value }))}
                      disabled={isAccountRestricted}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memo">Memo (Optional)</Label>
                  <Textarea
                    id="memo"
                    placeholder="What's this transfer for?"
                    value={transferData.memo}
                    onChange={(e) => setTransferData((prev) => ({ ...prev, memo: e.target.value }))}
                    disabled={isAccountRestricted}
                  />
                </div>
              </div>
              {/* Transfer Summary */}
              {transferData.amount && transferData.fromAccount && transferData.toAccount && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <p className="font-medium">Transfer Summary</p>
                        <p className="text-gray-600">
                          From: {transferData.fromAccount === "checking" ? "Checking" : "Savings"}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <div className="text-sm text-right">
                        <p className="font-medium">{formatCurrency(Number.parseFloat(transferData.amount || "0"))}</p>
                        <p className="text-gray-600">
                          To:{" "}
                          {transferData.transferType === "internal"
                            ? transferData.toAccount === "checking"
                              ? "Checking"
                              : "Savings"
                            : transferData.toAccount}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="flex space-x-4">
                <Button type="submit" className="flex-1" disabled={isAccountRestricted}>
                  Transfer Money
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
