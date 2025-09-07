"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  User,
  Shield,
  CreditCard,
  Bell,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Upload,
  Settings as SettingsIcon,
  Edit,
  Save,
  X
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataStore, type User as UserType } from "@/lib/data-store"
import { useToast } from "@/hooks/use-toast"

interface VerificationDocument {
  id: string
  type: "passport" | "drivers_license" | "national_id" | "proof_of_address"
  status: "pending" | "approved" | "rejected"
  uploadedAt: string
  rejectionReason?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [showAccountNumber, setShowAccountNumber] = useState(false)
  const [showRoutingNumber, setShowRoutingNumber] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<UserType>>({})
  const [verificationDocs, setVerificationDocs] = useState<VerificationDocument[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true)
      try {
        const isAuthenticated = localStorage.getItem("isAuthenticated")
        const currentUserId = localStorage.getItem("currentUserId")

        if (!isAuthenticated || !currentUserId) {
          router.push("/login")
          return
        }

        const dataStore = DataStore.getInstance()
        const result = await dataStore.getUserById(currentUserId)
        
        if (!result.success || !result.user) {
          console.error('Failed to load user data:', result.error)
          dataStore.signOut()
          router.push("/login")
          return
        }

        setUserData(result.user)
        setEditData(result.user)

        // Mock verification documents - in a real app, this would come from the API
        setVerificationDocs([
          {
            id: "doc-1",
            type: "drivers_license",
            status: result.user.verificationStatus === "verified" ? "approved" : "pending",
            uploadedAt: "2024-01-15",
            rejectionReason: result.user.verificationStatus === "rejected" ? "Document quality too low" : undefined
          },
          {
            id: "doc-2",
            type: "proof_of_address",
            status: result.user.verificationStatus === "verified" ? "approved" : 
                   result.user.verificationStatus === "documents_required" ? "pending" : "rejected",
            uploadedAt: "2024-01-16",
            rejectionReason: result.user.verificationStatus === "rejected" ? "Address doesn't match" : undefined
          }
        ])

      } catch (error) {
        console.error('Error loading settings data:', error)
        setError('Failed to load settings data')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [router])

  const handleSaveProfile = async () => {
    if (!userData || !editData) return

    try {
      const dataStore = DataStore.getInstance()
      const result = await dataStore.updateUser(userData.id, editData)
      
      if (result.success && result.user) {
        setUserData(result.user)
        setIsEditing(false)
        toast({
          title: "Profile Updated",
          description: "Your profile information has been updated successfully.",
        })
      } else {
        throw new Error(result.error || "Failed to update profile")
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getVerificationStatusInfo = (status: string) => {
    switch (status) {
      case "verified":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50 border-green-200",
          message: "Your account is fully verified and all features are available.",
          actionText: null
        }
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 border-yellow-200",
          message: "Your documents are being reviewed. This typically takes 1-3 business days.",
          actionText: null
        }
      case "documents_required":
        return {
          icon: AlertTriangle,
          color: "text-orange-600",
          bgColor: "bg-orange-50 border-orange-200",
          message: "Please upload the required documents to complete your verification.",
          actionText: "Upload Documents"
        }
      case "rejected":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50 border-red-200",
          message: "Some documents were rejected. Please review and re-upload.",
          actionText: "Re-upload Documents"
        }
      default:
        return {
          icon: Clock,
          color: "text-gray-600",
          bgColor: "bg-gray-50 border-gray-200",
          message: "Verification status unknown.",
          actionText: null
        }
    }
  }

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatDocumentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (error || !userData) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Settings</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const verificationInfo = getVerificationStatusInfo(userData.verificationStatus || "pending")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <SettingsIcon className="h-8 w-8 mr-3" />
              Account Settings
            </h1>
            <p className="text-gray-600">Manage your account information and preferences</p>
          </div>
        </div>

        {/* Verification Status Alert */}
        <Alert className={verificationInfo.bgColor}>
          <verificationInfo.icon className={`h-4 w-4 ${verificationInfo.color}`} />
          <AlertDescription className={verificationInfo.color}>
            {verificationInfo.message}
            {verificationInfo.actionText && (
              <Button variant="link" className="p-0 h-auto ml-2 text-sm underline">
                {verificationInfo.actionText}
              </Button>
            )}
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile & Account Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    <CardTitle>Personal Information</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (isEditing) {
                        setEditData(userData)
                        setIsEditing(false)
                      } else {
                        setIsEditing(true)
                      }
                    }}
                  >
                    {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={isEditing ? editData.firstName || "" : userData.firstName}
                      onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={isEditing ? editData.lastName || "" : userData.lastName}
                      onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email" className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={isEditing ? editData.email || "" : userData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={isEditing ? editData.phoneNumber || "" : userData.phoneNumber || "Not provided"}
                    onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={isEditing ? editData.address || "" : userData.address || "Not provided"}
                    onChange={(e) => setEditData({...editData, address: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date of Birth
                  </Label>
                  <Input
                    value={userData.dateOfBirth || "Not provided"}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Contact support to update your date of birth</p>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSaveProfile}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setEditData(userData)
                        setIsEditing(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  <CardTitle>Account Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Account Number</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={showAccountNumber ? userData.accountNumber : "****" + userData.accountNumber.slice(-4)}
                        disabled
                        className="bg-gray-50"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAccountNumber(!showAccountNumber)}
                      >
                        {showAccountNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Routing Number</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={showRoutingNumber ? userData.routingNumber || "123456789" : "****56789"}
                        disabled
                        className="bg-gray-50"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRoutingNumber(!showRoutingNumber)}
                      >
                        {showRoutingNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Account Status</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant={userData.accountStatus === "active" ? "default" : "secondary"}
                        className={
                          userData.accountStatus === "active" ? "bg-green-100 text-green-800" :
                          userData.accountStatus === "suspended" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {userData.accountStatus?.charAt(0).toUpperCase() + userData.accountStatus?.slice(1) || "Unknown"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Verification Status</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {getDocumentStatusBadge(userData.verificationStatus || "pending")}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Member Since</Label>
                  <Input
                    value={new Date(userData.createdAt || Date.now()).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Security & Documents */}
          <div className="space-y-6">
            
            {/* Security Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  <CardTitle>Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Two-Factor Authentication
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Questions
                </Button>
              </CardContent>
            </Card>

            {/* Verification Documents */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  <CardTitle>Verification Documents</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {verificationDocs.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {formatDocumentType(doc.type)}
                      </span>
                      {getDocumentStatusBadge(doc.status)}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                    </div>
                    {doc.rejectionReason && (
                      <div className="text-xs text-red-600 mb-2">
                        Reason: {doc.rejectionReason}
                      </div>
                    )}
                    {doc.status === "rejected" && (
                      <Button variant="outline" size="sm" className="w-full">
                        <Upload className="h-3 w-3 mr-2" />
                        Re-upload
                      </Button>
                    )}
                  </div>
                ))}
                
                {userData.verificationStatus === "documents_required" && (
                  <Button className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Required Documents
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  <CardTitle>Notifications</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email Notifications</span>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SMS Alerts</span>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Transaction Alerts</span>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}