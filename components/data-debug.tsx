"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataStore } from "@/lib/data-store"
import { Download, Trash2, RefreshCw, Loader2 } from "lucide-react"

export function DataDebug() {
  const [stats, setStats] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    // Only show in development or when explicitly enabled
    const isDev = process.env.NODE_ENV === "development"
    const isEnabled = localStorage.getItem("debug_mode") === "true"
    setIsVisible(isDev || isEnabled)

    if (isDev || isEnabled) {
      loadStats()
    }
  }, [])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const dataStore = DataStore.getInstance()
      const statsData = await dataStore.getDataStats()
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = async () => {
    setIsExporting(true)
    try {
      const dataStore = DataStore.getInstance()
      const data = await dataStore.exportData()
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `securebank-data-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export data:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const clearData = async () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      setIsClearing(true)
      try {
        const dataStore = DataStore.getInstance()
        const success = await dataStore.clearAllData()
        if (success) {
          await loadStats()
          alert('All data cleared successfully!')
          // Reload the page to reset the app state
          setTimeout(() => window.location.reload(), 1000)
        } else {
          alert('Failed to clear data. Please try again.')
        }
      } catch (error) {
        console.error('Failed to clear data:', error)
        alert('Failed to clear data. Please try again.')
      } finally {
        setIsClearing(false)
      }
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg border-2 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            Data Store Debug
            <Badge variant="secondary">v{stats?.version || '1.0.0'}</Badge>
          </CardTitle>
          <CardDescription className="text-xs">Development tools for data management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-xs">Loading stats...</span>
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium">Users:</span> {stats.totalUsers}
                </div>
                <div>
                  <span className="font-medium">Active:</span> {stats.activeUsers || 0}
                </div>
                <div>
                  <span className="font-medium">Inactive:</span> {stats.inactiveUsers || 0}
                </div>
                <div>
                  <span className="font-medium">Storage:</span> {Math.round((stats.storageSize || 0) / 1024)}KB
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Last updated: {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : 'Never'}
              </div>
            </>
          ) : (
            <div className="text-xs text-red-500">Failed to load stats</div>
          )}

          <div className="flex space-x-1">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={loadStats}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={exportData}
              disabled={isExporting || isLoading}
            >
              {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={clearData}
              disabled={isClearing || isLoading}
            >
              {isClearing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </Button>
          </div>

          <div className="text-xs text-gray-400">
            Server-side storage active
          </div>
        </CardContent>
      </Card>
    </div>
  )
}