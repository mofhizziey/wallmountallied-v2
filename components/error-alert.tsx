"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X, RefreshCw, Mail, Phone } from "lucide-react"
import { useState } from "react"

interface ErrorAlertProps {
  error: string
  type?: "auth" | "network" | "validation" | "system"
  onRetry?: () => void
  onDismiss?: () => void
  showContactSupport?: boolean
}

export function ErrorAlert({
  error,
  type = "system",
  onRetry,
  onDismiss,
  showContactSupport = false,
}: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(true)

  const getErrorConfig = () => {
    switch (type) {
      case "auth":
        return {
          color: "border-red-200 bg-red-50",
          iconColor: "text-red-600",
          textColor: "text-red-800",
          title: "Authentication Error",
        }
      case "network":
        return {
          color: "border-orange-200 bg-orange-50",
          iconColor: "text-orange-600",
          textColor: "text-orange-800",
          title: "Connection Error",
        }
      case "validation":
        return {
          color: "border-yellow-200 bg-yellow-50",
          iconColor: "text-yellow-600",
          textColor: "text-yellow-800",
          title: "Validation Error",
        }
      default:
        return {
          color: "border-red-200 bg-red-50",
          iconColor: "text-red-600",
          textColor: "text-red-800",
          title: "System Error",
        }
    }
  }

  const config = getErrorConfig()

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  return (
    <Alert className={`${config.color} border-l-4 relative`}>
      <AlertTriangle className={`h-4 w-4 ${config.iconColor}`} />
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className={`font-medium ${config.textColor} mb-1`}>{config.title}</h4>
            <AlertDescription className={config.textColor}>{error}</AlertDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-6 w-6 p-0 hover:bg-transparent">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 mt-3">
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry} className="h-7 text-xs bg-transparent">
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
          )}

          {showContactSupport && (
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open("mailto:support@securebank.com")}
                className="h-7 text-xs"
              >
                <Mail className="h-3 w-3 mr-1" />
                Email Support
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open("tel:+1-800-SECURE")}
                className="h-7 text-xs"
              >
                <Phone className="h-3 w-3 mr-1" />
                Call Support
              </Button>
            </div>
          )}
        </div>
      </div>
    </Alert>
  )
}
