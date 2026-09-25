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

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    const currentUserId = localStorage.getItem("currentUserId")

    if (!isAuthenticated || !currentUserId) {
      router.push("/login")
      return
    }

    // Fetch fresh user data from the API (not the stale sync version)
    fetch(`/api/users/${currentUserId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.user) {
          router.push("/login")
          return
        }
        const user = data.user
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
        setLoading(false)
      })
      .catch(() => {
        router.push("/login")
      })
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

    // Always re-fetch user to get up-to-date balances before processing
    const freshRes = await fetch(`/api/users/${userData.id}`)
    const freshData = await freshRes.json()
    const fromUser: User = freshData.user || userData

    let fromBalance: number
    if (transferData.fromAccount === "checking") {
      fromBalance = fromUser.checkingBalance
    } else {
      fromBalance = fromUser.savingsBalance
    }

    // Enforce: cannot transfer more than what's in the account
    if (amount > fromBalance) {
      toast({
        title: "Insufficient Funds",
        description: `You only have ${formatCurrency(fromBalance)} available in your ${transferData.fromAccount} account.`,
        variant: "destructive",
      })
      return
    }

    try {
      // Calculate new balances
      let newCheckingBalance = fromUser.checkingBalance
      let newSavingsBalance = fromUser.savingsBalance

      if (transferData.transferType === "internal") {
        // Deduct from source
        if (transferData.fromAccount === "checking") {
          newCheckingBalance -= amount
        } else {
          newSavingsBalance -= amount
        }
        // Add to destination
        const toAccount = transferData.toAccount as "checking" | "savings"
        if (toAccount === "checking") {
          newCheckingBalance += amount
        } else {
          newSavingsBalance += amount
        }

        // Save both transactions
        await Promise.all([
          fetch('/api/admin/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: fromUser.id,
              type: 'debit',
              amount,
              description: `Internal transfer to ${toAccount} account: ${transferData.memo || 'No memo'}`,
              category: 'Transfer',
              fromAccount: transferData.fromAccount,
            }),
          }),
          fetch('/api/admin/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: fromUser.id,
              type: 'credit',
              amount,
              description: `Internal transfer from ${transferData.fromAccount} account: ${transferData.memo || 'No memo'}`,
              category: 'Transfer',
              fromAccount: toAccount,
            }),
          }),
        ])
      } else {
        // External / Wire: just debit the sender
        if (transferData.fromAccount === "checking") {
          newCheckingBalance -= amount
        } else {
          newSavingsBalance -= amount
        }

        await fetch('/api/admin/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: fromUser.id,
            type: 'debit',
            amount,
            description: `${transferData.transferType} transfer to ${transferData.toAccount}: ${transferData.memo || 'No memo'}`,
            category: 'External Transfer',
            fromAccount: transferData.fromAccount,
          }),
        })
      }

      // Refresh user from DB and update UI
      const updatedRes = await fetch(`/api/users/${fromUser.id}`)
      const updatedData = await updatedRes.json()
      if (updatedData.success) {
        setUserData(updatedData.user)
      }

      toast({
        title: "Transfer Successful!",
        description: `${formatCurrency(amount)} has been transferred successfully.`,
      })
      setTransferData({
        fromAccount: "",
        toAccount: "",
        amount: "",
        memo: "",
        transferType: "internal",
      })
    } catch (err) {
      console.error('Transfer error:', err)
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

  const isAccountRestricted = userData.accountStatus !== "verified"

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
                          Checking - ****{userData.accountNumber?.slice(-4)} ({formatCurrency(userData.checkingBalance)})
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
                            <SelectItem value="checking">Checking - ****{userData.accountNumber?.slice(-4)}</SelectItem>
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
