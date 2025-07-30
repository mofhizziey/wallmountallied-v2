"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Shield, CheckCircle, Clock, Database } from "lucide-react"
import { useState, useEffect } from "react"

interface LoadingOverlayProps {
  isVisible: boolean
  title: string
  subtitle: string
  type?: "login" | "signup" | "general"
}

export function LoadingOverlay({ isVisible, title, subtitle, type = "general" }: LoadingOverlayProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = {
    login: [
      { icon: Shield, text: "Verifying credentials...", duration: 800 },
      { icon: Database, text: "Loading account data...", duration: 1000 },
      { icon: CheckCircle, text: "Preparing dashboard...", duration: 700 },
    ],
    signup: [
      { icon: Database, text: "Creating your account...", duration: 1000 },
      { icon: Shield, text: "Setting up security...", duration: 800 },
      { icon: CheckCircle, text: "Finalizing setup...", duration: 1200 },
    ],
    general: [
      { icon: Clock, text: "Processing...", duration: 1000 },
      { icon: CheckCircle, text: "Almost done...", duration: 1000 },
    ],
  }

  const currentSteps = steps[type]

  useEffect(() => {
    if (!isVisible) {
      setProgress(0)
      setCurrentStep(0)
      return
    }

    let totalDuration = 0
    let currentDuration = 0

    // Calculate total duration
    currentSteps.forEach((step) => {
      totalDuration += step.duration
    })

    // Animate progress through steps
    currentSteps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index)
      }, currentDuration)

      setTimeout(
        () => {
          const progressValue = ((currentDuration + step.duration) / totalDuration) * 100
          setProgress(progressValue)
        },
        currentDuration + step.duration / 2,
      )

      currentDuration += step.duration
    })
  }, [isVisible, type])

  if (!isVisible) return null

  const CurrentIcon = currentSteps[currentStep]?.icon || Shield

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-0">
        <CardContent className="p-8 text-center">
          <div className="space-y-6">
            {/* Icon with animation */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-20"></div>
                <div className="relative bg-blue-600 rounded-full p-4">
                  <CurrentIcon className="h-8 w-8 text-white animate-pulse" />
                </div>
              </div>
            </div>

            {/* Title and subtitle */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              <p className="text-gray-600">{subtitle}</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-500">{currentSteps[currentStep]?.text || "Processing..."}</p>
            </div>

            {/* Step indicators */}
            <div className="flex justify-center space-x-2">
              {currentSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    index <= currentStep ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Security message */}
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-800 flex items-center justify-center">
                <Shield className="h-3 w-3 mr-1" />
                Your data is encrypted and secure
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
