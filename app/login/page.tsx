"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DataStore } from "@/lib/data-store"
import { LoadingOverlay } from "@/components/loading-overlay"
import { ErrorAlert } from "@/components/error-alert"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<"credentials" | "pin">("credentials")
  const [showPassword, setShowPassword] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    pin: "",
  })

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const dataStore = DataStore.getInstance()
      const result = await dataStore.authenticateUser(formData.email, formData.password)

      if (!result.success) {
        setError(result.error || "Authentication failed")
        setIsLoading(false)
        return
      }

      setCurrentUser(result.user)
      setStep("pin")
      setIsLoading(false)

      toast({
        title: "Credentials Verified",
        description: "Please enter your PIN to complete login",
      })
    } catch (error) {
      console.error("Login error:", error)
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const dataStore = DataStore.getInstance()
      const result = await dataStore.validatePin(currentUser.id, formData.pin)

      if (!result.success) {
        setError(result.error || "PIN validation failed")
        setIsLoading(false)
        return
      }

      localStorage.setItem("currentUserId", currentUser.id)
      localStorage.setItem("isAuthenticated", "true")

      toast({
        title: "Login Successful",
        description: `Welcome back, ${currentUser.firstName}!`,
      })

      // Simulate loading time for better UX
      setTimeout(() => {
        router.push("/dashboard")
      }, 2500)
    } catch (error) {
      console.error("PIN validation error:", error)
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  const handleBackToCredentials = () => {
    setStep("credentials")
    setCurrentUser(null)
    setFormData((prev) => ({ ...prev, pin: "" }))
    setError("")
  }

  const handleRetry = () => {
    setError("")
    if (step === "credentials") {
      handleCredentialsSubmit(new Event("submit") as any)
    } else {
      handlePinSubmit(new Event("submit") as any)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">{step === "credentials" ? "Welcome Back" : "Enter Your PIN"}</CardTitle>
            <CardDescription>
              {step === "credentials"
                ? "Sign in to your SecureBank account"
                : `Hi ${currentUser?.firstName}, please enter your 4-digit PIN`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Alert */}
            {error && (
              <ErrorAlert
                error={error}
                type="auth"
                onRetry={handleRetry}
                onDismiss={() => setError("")}
                showContactSupport={error.includes("suspended") || error.includes("closed")}
              />
            )}

            {step === "credentials" ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                    className={error && error.includes("email") ? "border-red-300" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                      className={error && error.includes("password") ? "border-red-300" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Continue"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pin">4-Digit PIN</Label>
                  <div className="relative">
                    <Input
                      id="pin"
                      type={showPin ? "text" : "password"}
                      maxLength={4}
                      pattern="\d{4}"
                      value={formData.pin}
                      onChange={(e) => handleInputChange("pin", e.target.value.replace(/\D/g, ""))}
                      placeholder="••••"
                      className={`text-center text-2xl tracking-widest ${
                        error && error.includes("PIN") ? "border-red-300" : ""
                      }`}
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPin(!showPin)}
                      disabled={isLoading}
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToCredentials}
                    className="flex-1 bg-transparent"
                    disabled={isLoading}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" size="lg" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </div>
              </form>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/signup" className="text-blue-600 hover:underline font-medium">
                  Sign up
                </Link>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Forgot your password?{" "}
                <Link href="#" className="text-blue-600 hover:underline">
                  Reset it here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <LoadingOverlay
        isVisible={isLoading}
        title={step === "credentials" ? "Verifying Credentials" : `Welcome back, ${currentUser?.firstName}!`}
        subtitle={step === "credentials" ? "Checking your account details..." : "Loading your banking dashboard..."}
        type="login"
      />
    </>
  )
}
