"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Car, Home, Utensils, Gamepad2 } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function AnalyticsPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const spendingCategories = [
    { name: "Housing", amount: 1200, budget: 1500, icon: Home, color: "bg-blue-500" },
    { name: "Food & Dining", amount: 450, budget: 600, icon: Utensils, color: "bg-green-500" },
    { name: "Transportation", amount: 320, budget: 400, icon: Car, color: "bg-yellow-500" },
    { name: "Shopping", amount: 280, budget: 300, icon: ShoppingCart, color: "bg-purple-500" },
    { name: "Entertainment", amount: 150, budget: 200, icon: Gamepad2, color: "bg-pink-500" },
  ]

  const monthlyTrends = [
    { month: "Jan", income: 3500, expenses: 2800 },
    { month: "Feb", income: 3500, expenses: 2950 },
    { month: "Mar", income: 3500, expenses: 2750 },
    { month: "Apr", income: 3500, expenses: 2900 },
    { month: "May", income: 3500, expenses: 2650 },
    { month: "Jun", income: 3500, expenses: 2800 },
  ]

  if (!userData) {
    return <div>Loading...</div>
  }

  const totalSpent = spendingCategories.reduce((sum, cat) => sum + cat.amount, 0)
  const totalBudget = spendingCategories.reduce((sum, cat) => sum + cat.budget, 0)
  const savingsRate = ((3500 - totalSpent) / 3500) * 100

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Analytics</h1>
          <p className="text-gray-600">Insights into your spending patterns and financial health</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(3500)}</div>
              <p className="text-xs text-muted-foreground">+2.5% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
              <p className="text-xs text-muted-foreground">-5.2% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savingsRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Above recommended 20%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{((totalSpent / totalBudget) * 100).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Of monthly budget used</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spending by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Your spending breakdown for this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {spendingCategories.map((category) => {
                const IconComponent = category.icon
                const percentage = (category.amount / category.budget) * 100
                const isOverBudget = percentage > 100

                return (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${category.color} bg-opacity-10`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(category.amount)} of {formatCurrency(category.budget)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={isOverBudget ? "destructive" : "secondary"}>{percentage.toFixed(0)}%</Badge>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className="h-2" />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>Income vs expenses over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyTrends.map((month) => (
                  <div key={month.month} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{month.month}</span>
                      <span className="text-gray-500">Net: {formatCurrency(month.income - month.expenses)}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Income: {formatCurrency(month.income)}</span>
                        <span>Expenses: {formatCurrency(month.expenses)}</span>
                      </div>
                      <div className="relative h-4 bg-gray-200 rounded">
                        <div className="absolute left-0 top-0 h-full bg-green-500 rounded" style={{ width: "100%" }} />
                        <div
                          className="absolute left-0 top-0 h-full bg-red-500 rounded"
                          style={{ width: `${(month.expenses / month.income) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Health Score */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Health Score</CardTitle>
            <CardDescription>Based on your spending habits, savings rate, and account activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">85</div>
                <p className="text-sm text-gray-600">Overall Score</p>
                <Badge className="mt-2 bg-green-100 text-green-800">Excellent</Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Savings Rate</span>
                    <span>92/100</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Budget Adherence</span>
                    <span>78/100</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Payment History</span>
                    <span>95/100</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Recommendations</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Consider increasing your emergency fund</li>
                  <li>• Review your entertainment spending</li>
                  <li>• Great job maintaining your savings rate!</li>
                  <li>• Your payment history is excellent</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
