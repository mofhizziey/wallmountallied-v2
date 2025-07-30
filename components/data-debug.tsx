"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataStore } from "@/lib/data-store"
import { Download, Trash2, RefreshCw } from "lucide-react"

export function DataDebug() {
  const [stats, setStats] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development or when explicitly enabled
    const isDev = process.env.NODE_ENV === "development"
    const isEnabled = localStorage.getItem("debug_mode") === "true"
    setIsVisible(isDev || isEnabled)

    if (isDev || isEnabled) {
      loadStats()
    }
  }, [])

  const loadStats = () => {
    const dataStore = DataStore.getInstance()
    setStats(dataStore.getDataStats())
  }

  const exportData = () => {
    const dataStore = DataStore.getInstance()
    const data = dataStore.exportData()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `securebank-data-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearData = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      const dataStore = DataStore.getInstance()
      dataStore.clearAllData()
      loadStats()
      window.location.reload()
    }
  }

  if (!isVisible || !stats) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg border-2 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            Data Store Debug
            <Badge variant="secondary">v{stats.version}</Badge>
          </CardTitle>
          <CardDescription className="text-xs">Development tools for data management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium">Users:</span> {stats.totalUsers}
            </div>
            <div>
              <span className="font-medium">Transactions:</span> {stats.totalTransactions}
            </div>
            <div>
              <span className="font-medium">Admins:</span> {stats.totalAdmins}
            </div>
            <div>
              <span className="font-medium">Storage:</span> {Math.round(stats.storageSize / 1024)}KB
            </div>
          </div>

          <div className="text-xs text-gray-500">Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}</div>

          <div className="flex space-x-1">
            <Button size="sm" variant="outline" onClick={loadStats}>
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={exportData}>
              <Download className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="destructive" onClick={clearData}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
