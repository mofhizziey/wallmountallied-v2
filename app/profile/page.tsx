"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Camera,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  CreditCard
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataStore, type User as UserType } from "@/lib/data-store"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<UserType>>({})
  const [profileImage, setProfileImage] = useState<string>("")
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
        
        // Generate a placeholder profile image URL
        setProfileImage(`https://api.dicebear.com/7.x/initials/svg?seed=${result.user.firstName} ${result.user.lastName}&backgroundColor=3b82f6`)

      } catch (error) {
        console.error('Error loading profile data:', error)
        setError('Failed to load profile data')
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

  const handleCancelEdit = () => {
    setEditData(userData || {})
    setIsEditing(false)
  }

  const handleInputChange = (field: keyof UserType, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getVerificationStatusInfo = (status: string) => {
    switch (status) {
      case "verified":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50 border-green-200",
          message: "Account fully verified",
          badgeColor: "bg-green-100 text-green-800"
        }
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 border-yellow-200",
          message: "Verification in progress",
          badgeColor: "bg-yellow-100 text-yellow-800"
        }
      case "documents_required":
        return {
          icon: AlertTriangle,
          color: "text-orange-600",
          bgColor: "bg-orange-50 border-orange-200",
          message: "Documents required",
          badgeColor: "bg-orange-100 text-orange-800"
        }
      case "rejected":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50 border-red-200",
          message: "Verification rejected",
          badgeColor: "bg-red-100 text-red-800"
        }
      default:
        return {
          icon: Clock,
          color: "text-gray-600",
          bgColor: "bg-gray-50 border-gray-200",
          message: "Status unknown",
          badgeColor: "bg-gray-100 text-gray-800"
        }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
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
              <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
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
              <User className="h-8 w-8 mr-3" />
              My Profile
            </h1>
            <p className="text-gray-600">View and manage your personal information</p>
          </div>
          <Button 
            variant="outline"
            onClick={() => router.push("/dashboard/settings")}
          >
            <Shield className="h-4 w-4 mr-2" />
            Account Settings
          </Button>
        </div>

        {/* Verification Status Alert */}
        {userData.verificationStatus !== "verified" && (
          <Alert className={verificationInfo.bgColor}>
            <verificationInfo.icon className={`h-4 w-4 ${verificationInfo.color}`} />
            <AlertDescription className={verificationInfo.color}>
              <strong>Account Verification:</strong> {verificationInfo.message}
              {userData.verificationStatus === "documents_required" && (
                <Button variant="link" className="p-0 h-auto ml-2 text-sm underline" onClick={() => router.push("/dashboard/settings")}>
                  Upload Documents
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Photo & Quick Stats */}
          <div className="space-y-6">
            
            {/* Profile Photo Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Profile Photo</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="relative mx-auto w-32 h-32">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={profileImage} alt={`${userData.firstName} ${userData.lastName}`} />
                    <AvatarFallback className="text-2xl">
                      {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0"
                    onClick={() => toast({ title: "Coming Soon", description: "Photo upload feature will be available soon." })}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{userData.firstName} {userData.lastName}</h3>
                  <p className="text-gray-600">{userData.email}</p>
                  <Badge className={verificationInfo.badgeColor} variant="secondary">
                    {userData.verificationStatus || "pending"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Account Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium">
                    {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Type</span>
                  <Badge variant="outline">Standard</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant={userData.isActive ? "default" : "secondary"}>
                    {userData.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your basic personal details</CardDescription>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveProfile}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        value={editData.firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{userData.firstName}</span>
                      </div>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        value={editData.lastName || ''}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{userData.lastName}</span>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{userData.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{userData.phone || 'Not provided'}</span>
                      </div>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    {isEditing ? (
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={editData.dateOfBirth || ''}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{userData.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString() : 'Not provided'}</span>
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    {isEditing ? (
                      <Input
                        id="location"
                        value={editData.location || ''}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Enter your location"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{userData.location || 'Not provided'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      value={editData.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md min-h-[80px]">
                      <p className="text-gray-600">{userData.bio || 'No bio provided'}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Security & Privacy Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security & Privacy
                </CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Password</h4>
                    <p className="text-sm text-gray-600">Last changed 30 days ago</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/settings/password")}>
                    Change Password
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/settings/2fa")}>
                    Enable 2FA
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Privacy Settings</h4>
                    <p className="text-sm text-gray-600">Control your data and privacy</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/settings/privacy")}>
                    Manage Privacy
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>Irreversible account actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <h4 className="font-medium text-red-800">Delete Account</h4>
                    <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => toast({
                      title: "Account Deletion",
                      description: "Please contact support to delete your account.",
                      variant: "destructive"
                    })}
                  >
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}