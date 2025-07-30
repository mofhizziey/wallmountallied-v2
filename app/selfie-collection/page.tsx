"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, RotateCcw, Check, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DataStore } from "@/lib/data-store"

export default function SelfieCollectionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isValidUser, setIsValidUser] = useState(false)
  const [userName, setUserName] = useState("User")

  useEffect(() => {
    if (userId) {
      const dataStore = DataStore.getInstance()
      const user = dataStore.getUserById(userId)
      if (user) {
        setIsValidUser(true)
        setUserName(user.firstName || "User")
        // If a selfie already exists, show it
        if (user.selfieUrl) {
          setCapturedImage(user.selfieUrl)
        }
      } else {
        toast({
          title: "Invalid Link",
          description: "The user ID provided is not valid.",
          variant: "destructive",
        })
        setIsValidUser(false)
      }
    } else {
      toast({
        title: "Missing User ID",
        description: "This page requires a user ID to function.",
        variant: "destructive",
      })
      setIsValidUser(false)
    }
  }, [userId, toast])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
      }
    } catch (error) {
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to complete verification",
        variant: "destructive",
      })
    }
  }, [toast])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setIsStreaming(false)
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    const imageData = canvas.toDataURL("image/jpeg", 0.8)
    setCapturedImage(imageData)
    stopCamera()
  }, [stopCamera])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    startCamera()
  }, [startCamera])

  const submitSelfie = useCallback(async () => {
    if (!capturedImage || !userId) return

    setIsProcessing(true)

    try {
      const dataStore = DataStore.getInstance()
      const updatedUser = dataStore.updateUser(userId, {
        selfieUrl: capturedImage,
        verificationStatus: "pending", // Set to pending for admin review
      })

      if (updatedUser) {
        toast({
          title: "Selfie Submitted",
          description: "Your selfie has been submitted for review by the admin.",
        })
        // Redirect to a confirmation page or login
        router.push("/login")
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [capturedImage, userId, router, toast])

  if (!isValidUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>This link is invalid or expired. Please contact support.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Selfie Collection for {userName}</CardTitle>
          <CardDescription>Please take a clear selfie for identity verification.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            {!capturedImage ? (
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {isStreaming ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Position your face in the frame</p>
                      <Button onClick={startCamera}>
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={capturedImage || "/placeholder.svg"}
                  alt="Captured selfie"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="space-y-3">
            {isStreaming && !capturedImage && (
              <Button onClick={capturePhoto} className="w-full" size="lg">
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            )}

            {capturedImage && (
              <div className="flex space-x-2">
                <Button onClick={retakePhoto} variant="outline" className="flex-1 bg-transparent">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button onClick={submitSelfie} disabled={isProcessing} className="flex-1">
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Submit Selfie
                </Button>
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Your selfie will be securely stored and used only for identity verification purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
