"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, RotateCcw, Check, X, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DataStore } from "@/lib/data-store"

export default function SelfieVerificationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

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

  const submitVerification = useCallback(async () => {
    if (!capturedImage) return

    setIsProcessing(true)

    try {
      const currentUserId = localStorage.getItem("currentUserId")
      if (!currentUserId) {
        router.push("/login")
        return
      }

      const dataStore = DataStore.getInstance()
      const updatedUser = dataStore.updateUser(currentUserId, {
        selfieUrl: capturedImage,
        verificationStatus: "verified",
      })

      if (updatedUser) {
        toast({
          title: "Verification Submitted",
          description: "Your selfie has been submitted for review",
        })
        router.push("/dashboard")
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [capturedImage, router, toast])

  const skipVerification = useCallback(() => {
    toast({
      title: "Verification Skipped",
      description: "You can complete this later in your account settings",
    })
    router.push("/dashboard")
  }, [router, toast])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Selfie Verification</CardTitle>
          <CardDescription>Take a selfie to verify your identity (Optional)</CardDescription>
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
                <Button onClick={submitVerification} disabled={isProcessing} className="flex-1">
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Submit
                </Button>
              </div>
            )}

            <Button onClick={skipVerification} variant="ghost" className="w-full">
              <X className="h-4 w-4 mr-2" />
              Skip for Now
            </Button>
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
