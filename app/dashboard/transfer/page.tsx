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

export default function TransferPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<any>(null)
  const [transferData, setTransferData] = useState({
    fromAccount: "",
    toAccount: "",
    amount: "",
    memo: "",
    transferType: "internal",
  })

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    const storedUser = localStorage.getItem("bankUser")
    if (storedUser) {
      setUserData(JSON.parse(storedUser))
    }
  }, [router])

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault()

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

    // Simulate transfer processing
    toast({
      title: "Transfer Successful!",
      description: `$${amount.toFixed(2)} has been transferred successfully`,
    })

    // Reset form
    setTransferData({
      fromAccount: "",
      toAccount: "",
      amount: "",
      memo: "",
      transferType: "internal",
    })
  }

  if (!userData) {
    return <div>Loading...</div>
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
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">
                          Checking - ****{userData.accountNumber.slice(-4)}
                          (${userData.accountBalance.toFixed(2)})
                        </SelectItem>
                        <SelectItem value="savings">
                          Savings - ****{(Number.parseInt(userData.accountNumber) + 1).toString().slice(-4)}
                          (${userData.savingsBalance.toFixed(2)})
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
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="savings">
                            Savings - ****{(Number.parseInt(userData.accountNumber) + 1).toString().slice(-4)}
                          </SelectItem>
                          <SelectItem value="checking">Checking - ****{userData.accountNumber.slice(-4)}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Enter account number or email"
                        value={transferData.toAccount}
                        onChange={(e) => setTransferData((prev) => ({ ...prev, toAccount: e.target.value }))}
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
                        <p className="font-medium">${Number.parseFloat(transferData.amount || "0").toFixed(2)}</p>
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
                <Button type="submit" className="flex-1">
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
