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
import { Calendar, CreditCard, Zap, Wifi, Car, Home } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"

interface Bill {
  id: string
  company: string
  category: string
  amount: number
  dueDate: string
  status: "paid" | "pending" | "overdue"
  icon: any
}

export default function BillsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<any>(null)
  const [bills, setBills] = useState<Bill[]>([])
  const [paymentData, setPaymentData] = useState({
    billId: "",
    amount: "",
    paymentDate: "",
    fromAccount: "",
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

    // Sample bills data
    const sampleBills: Bill[] = [
      {
        id: "1",
        company: "Electric Company",
        category: "Utilities",
        amount: 125.5,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pending",
        icon: Zap,
      },
      {
        id: "2",
        company: "Internet Provider",
        category: "Utilities",
        amount: 79.99,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pending",
        icon: Wifi,
      },
      {
        id: "3",
        company: "Credit Card",
        category: "Credit",
        amount: 450.0,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pending",
        icon: CreditCard,
      },
      {
        id: "4",
        company: "Car Insurance",
        category: "Insurance",
        amount: 180.0,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: "paid",
        icon: Car,
      },
      {
        id: "5",
        company: "Mortgage",
        category: "Housing",
        amount: 1850.0,
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pending",
        icon: Home,
      },
    ]
    setBills(sampleBills)
  }, [router])

  const handlePayBill = (e: React.FormEvent) => {
    e.preventDefault()

    if (!paymentData.billId || !paymentData.amount || !paymentData.fromAccount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const bill = bills.find((b) => b.id === paymentData.billId)
    if (bill) {
      // Update bill status
      setBills((prev) => prev.map((b) => (b.id === paymentData.billId ? { ...b, status: "paid" as const } : b)))

      toast({
        title: "Payment Successful!",
        description: `Payment of $${Number.parseFloat(paymentData.amount).toFixed(2)} to ${bill.company} has been processed`,
      })

      // Reset form
      setPaymentData({
        billId: "",
        amount: "",
        paymentDate: "",
        fromAccount: "",
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
    return <div>Loading...</div>
  }

  const pendingBills = bills.filter((bill) => bill.status === "pending")
  const totalDue = pendingBills.reduce((sum, bill) => sum + bill.amount, 0)

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
                {pendingBills.length > 0 ? formatDate(pendingBills[0].dueDate) : "None"}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingBills.length > 0 ? pendingBills[0].company : "All bills paid"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(2485.49)}</div>
              <p className="text-xs text-muted-foreground">Total bills paid</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bills List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Bills</CardTitle>
              <CardDescription>Upcoming and recent bill payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bills.map((bill) => {
                  const IconComponent = bill.icon
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
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a bill to pay" />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingBills.map((bill) => (
                        <SelectItem key={bill.id} value={bill.id}>
                          {bill.company} - {formatCurrency(bill.amount)}
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
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromAccount">Pay From</Label>
                  <Select
                    value={paymentData.fromAccount}
                    onValueChange={(value) => setPaymentData((prev) => ({ ...prev, fromAccount: value }))}
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
                  <Label htmlFor="paymentDate">Payment Date</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData((prev) => ({ ...prev, paymentDate: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <Button type="submit" className="w-full">
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
