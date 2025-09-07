"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Car,
  Home,
  Utensils,
  Gamepad2,
  Zap,
  CreditCard,
  Shield,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useToast } from "@/hooks/use-toast"
import { DataStore, type User, type Transaction } from "@/lib/data-store"

const categoryIcons: { [key: string]: any } = {
  Housing: Home,
  "Food & Dining": Utensils,
  Transportation: Car,
  Shopping: ShoppingCart,
  Entertainment: Gamepad2,
  Utilities: Zap,
  Credit: CreditCard,
  Insurance: Shield,
  Transfer: TrendingUp,
  "External Transfer": TrendingUp,
  "Admin Action": DollarSign,
}

// Base categories with static budget values.
// To make budgets dynamic, they would need to be stored per user in the DataStore.
const baseCategories = [
  { name: "Housing", budget: 1500, icon: Home, color: "bg-blue-500" },
  { name: "Food & Dining", budget: 600, icon: Utensils, color: "bg-green-500" },
  { name: "Transportation", budget: 400, icon: Car, color: "bg-yellow-500" },
  { name: "Shopping", budget: 300, icon: ShoppingCart, color: "bg-purple-500" },
  { name: "Entertainment", budget: 200, icon: Gamepad2, color: "bg-pink-500" },
  { name: "Utilities", budget: 250, icon: Zap, color: "bg-orange-500" },
  { name: "Credit", budget: 500, icon: CreditCard, color: "bg-red-500" },
  { name: "Insurance", budget: 180, icon: Shield, color: "bg-teal-500" },
  { name: "Transfer", budget: 1000, icon: TrendingUp, color: "bg-indigo-500" },
  { name: "External Transfer", budget: 1000, icon: TrendingUp, color: "bg-gray-500" },
  { name: "Admin Action", budget: 0, icon: DollarSign, color: "bg-gray-400" },
]

export default function AnalyticsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])

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
    const userTransactions = dataStore.getTransactionsByUserId(currentUserId)
    setTransactions(userTransactions)
  }, [router, toast])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const processedSpendingCategories = useMemo(() => {
    const categoryAmounts: { [key: string]: number } = {}
    transactions?.forEach((txn) => {
      if (txn.type === "debit") {
        categoryAmounts[txn.category] = (categoryAmounts[txn.category] || 0) + txn.amount
      }
    })

    const allCategories = new Set([...baseCategories.map((c) => c.name), ...Object.keys(categoryAmounts)])

    return Array.from(allCategories)
      .map((categoryName) => {
        const baseCat = baseCategories.find((c) => c.name === categoryName)
        return {
          name: categoryName,
          amount: categoryAmounts[categoryName] || 0,
          budget: baseCat?.budget || 0, // Use 0 if no budget defined
          icon: baseCat?.icon || Home,
          color: baseCat?.color || "bg-gray-500",
        }
      })
      .sort((a, b) => b.amount - a.amount)
  }, [])

  const processedMonthlyTrends = useMemo(() => {
    const trendsMap: { [key: string]: { income: number; expenses: number } } = {}
    const today = new Date()
    const months = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthName = d.toLocaleString("en-US", { month: "short" })
      const year = d.getFullYear()
      const key = `${monthName} ${year}`
      months.push({ key, monthName })
      trendsMap[key] = { income: 0, expenses: 0 }
    }

    transactions.forEach((txn) => {
      const txnDate = new Date(txn.date)
      const monthName = txnDate.toLocaleString("en-US", { month: "short" })
      const year = txnDate.getFullYear()
      const key = `${monthName} ${year}`

      if (trendsMap[key]) {
        if (txn.type === "debit") {
          trendsMap[key].expenses += txn.amount
        }
        if (txn.type === "credit") {
          trendsMap[key].income += txn.amount
        }
      }
    })

    return months.map(({ key, monthName }) => ({
      month: monthName,
      income: trendsMap[key]?.income || 0,
      expenses: trendsMap[key]?.expenses || 0,
    }))
  }, [transactions])

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

  const totalSpent = processedSpendingCategories.reduce((sum, cat) => sum + cat.amount, 0)
  const totalBudget = processedSpendingCategories.reduce((sum, cat) => sum + cat.budget, 0)

  const currentMonthData = processedMonthlyTrends[processedMonthlyTrends.length - 1]
  const currentMonthlyIncome = currentMonthData?.income || 0
  const currentMonthlyExpenses = currentMonthData?.expenses || 0

  const savingsRate =
    currentMonthlyIncome > 0 ? ((currentMonthlyIncome - currentMonthlyExpenses) / currentMonthlyIncome) * 100 : 0

  // Financial Health Score calculations
  const budgetAdherenceScore = totalBudget > 0 ? Math.max(0, (1 - totalSpent / totalBudget) * 100) : 100
  const overallScore = (savingsRate + budgetAdherenceScore) / 2

  const getOverallScoreBadge = (score: number) => {
    if (score >= 80) return { text: "Excellent", color: "bg-green-100 text-green-800" }
    if (score >= 60) return { text: "Good", color: "bg-blue-100 text-blue-800" }
    if (score >= 40) return { text: "Fair", color: "bg-yellow-100 text-yellow-800" }
    return { text: "Needs Improvement", color: "bg-red-100 text-red-800" }
  }

  const overallScoreBadge = getOverallScoreBadge(overallScore)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Analytics</h1>
          <p className="text-gray-600">Insights into your spending patterns and financial health</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentMonthlyIncome)}</div>
              <p className="text-xs text-muted-foreground">
                {processedMonthlyTrends.length > 1 &&
                currentMonthlyIncome > processedMonthlyTrends[processedMonthlyTrends.length - 2].income
                  ? `+${formatCurrency(currentMonthlyIncome - processedMonthlyTrends[processedMonthlyTrends.length - 2].income)} from last month`
                  : processedMonthlyTrends.length > 1 &&
                      currentMonthlyIncome < processedMonthlyTrends[processedMonthlyTrends.length - 2].income
                    ? `${formatCurrency(currentMonthlyIncome - processedMonthlyTrends[processedMonthlyTrends.length - 2].income)} from last month`
                    : "No change from last month"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentMonthlyExpenses)}</div>
              <p className="text-xs text-muted-foreground">
                {processedMonthlyTrends.length > 1 &&
                currentMonthlyExpenses < processedMonthlyTrends[processedMonthlyTrends.length - 2].expenses
                  ? `-${formatCurrency(processedMonthlyTrends[processedMonthlyTrends.length - 2].expenses - currentMonthlyExpenses)} from last month`
                  : processedMonthlyTrends.length > 1 &&
                      currentMonthlyExpenses > processedMonthlyTrends[processedMonthlyTrends.length - 2].expenses
                    ? `+${formatCurrency(currentMonthlyExpenses - processedMonthlyTrends[processedMonthlyTrends.length - 2].expenses)} from last month`
                    : "No change from last month"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savingsRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {savingsRate >= 20 ? "Above recommended 20%" : "Below recommended 20%"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Of monthly budget used</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Your spending breakdown for this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {processedSpendingCategories.length === 0 ||
              processedSpendingCategories.every((cat) => cat.amount === 0) ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No spending data yet</p>
                  <p className="text-sm text-gray-500">
                    Your spending breakdown will appear here once you make transactions.
                  </p>
                </div>
              ) : (
                processedSpendingCategories.map((category) => {
                  const IconComponent = category.icon || Home
                  const percentage = category.budget > 0 ? (category.amount / category.budget) * 100 : 0
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
                              {formatCurrency(category.amount)}{" "}
                              {category.budget > 0 && `of ${formatCurrency(category.budget)}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant={isOverBudget ? "destructive" : "secondary"}>{percentage.toFixed(0)}%</Badge>
                      </div>
                      <Progress value={Math.min(percentage, 100)} className="h-2" />
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>Income vs expenses over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {processedMonthlyTrends.every((m) => m.income === 0 && m.expenses === 0) ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No trend data yet</p>
                  <p className="text-sm text-gray-500">Your monthly income and expenses trends will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {processedMonthlyTrends.map((month) => (
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
                          <div
                            className="absolute left-0 top-0 h-full bg-green-500 rounded"
                            style={{ width: `${month.income > 0 ? 100 : 0}%` }}
                          />
                          <div
                            className="absolute left-0 top-0 h-full bg-red-500 rounded"
                            style={{ width: `${month.income > 0 ? (month.expenses / month.income) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Financial Health Score</CardTitle>
            <CardDescription>Based on your spending habits, savings rate, and account activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">{overallScore.toFixed(0)}</div>
                <p className="text-sm text-gray-600">Overall Score</p>
                <Badge className={`mt-2 ${overallScoreBadge.color}`}>{overallScoreBadge.text}</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Savings Rate</span>
                    <span>{savingsRate.toFixed(0)}/100</span>
                  </div>
                  <Progress value={Math.min(savingsRate, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Budget Adherence</span>
                    <span>{budgetAdherenceScore.toFixed(0)}/100</span>
                  </div>
                  <Progress value={Math.min(budgetAdherenceScore, 100)} className="h-2" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Recommendations</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {savingsRate < 20 && <li>• Consider increasing your savings rate.</li>}
                  {budgetAdherenceScore < 60 && <li>• Review your spending to stay within budget.</li>}
                  {savingsRate >= 20 && <li>• Great job maintaining your savings rate!</li>}
                  {budgetAdherenceScore >= 80 && <li>• Excellent budget adherence!</li>}
                  {processedSpendingCategories.some((cat) => cat.amount > cat.budget && cat.budget > 0) && (
                    <li>• Identify categories where you consistently overspend.</li>
                  )}
                  {processedSpendingCategories.every((cat) => cat.amount === 0) && (
                    <li>• Start making transactions to build your financial history.</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
