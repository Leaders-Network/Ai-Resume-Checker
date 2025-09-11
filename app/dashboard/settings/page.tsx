"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { auth, db } from "@/config/firebase"
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import toast, { Toaster } from "react-hot-toast"
import { motion } from "framer-motion"
import { User, Lock, CreditCard, Save, Camera, Upload, Mail, Calendar, Shield, Trash2 } from "lucide-react"
import { getUserSubscription, type SubscriptionData } from "@/lib/auth"



interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  profileImage?: string
  createdAt: string
  lastLoginAt: string
}

// Add proper types for Paystack
interface PaystackResponse {
  reference: string
  status: string
  trans: string
  transaction: string
  message: string
  redirecturl: string
}

interface PaystackHandler {
  openIframe: () => void
}

interface PaystackPop {
  setup: (config: {
    key: string
    email: string | null
    amount: number
    currency: string
    ref: string
    metadata: {
      custom_fields: Array<{
        display_name: string
        variable_name: string
        value: string
      }>
    }
    callback: (response: PaystackResponse) => void
    onClose: () => void
  }) => PaystackHandler
}

// Update global declaration with proper types
declare global {
  interface Window {
    PaystackPop: PaystackPop
  }
}

const SettingsPage = () => {
  const [user, loading] = useAuthState(auth)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [profileImagePreview, setProfileImagePreview] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)




  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return
      try {
        const userDocRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userDocRef)
        if (userDoc.exists()) {
          const profileData = userDoc.data() as UserProfile
          setUserProfile(profileData)
          // Use the most recent profile image
          const latestPhotoURL = profileData.profileImage || profileData.photoURL || user.photoURL
          if (latestPhotoURL) {
            setProfileImagePreview(latestPhotoURL)
          }
        }
      } catch (error) {
        console.error("Error loading user profile:", error)
      }
    }

    const loadSubscriptionData = async () => {
      if (!user) return
      try {
        const subscription = await getUserSubscription(user.uid)
        setSubscriptionData(subscription)
      } catch (error) {
        console.error("Error loading subscription data:", error)
      }
    }

    if (user) {
      setDisplayName(user.displayName || "")
      setEmail(user.email || "")
      setProfileImagePreview(user.photoURL || "")
      loadUserProfile()
      loadSubscriptionData()
    }
  }, [user])



  const handleProfileUpdate = async () => {
    if (!user) return
    setIsUpdating(true)
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName,
        photoURL: profileImagePreview || user.photoURL,
      })

      // Update Firestore document
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        displayName,
        profileImage: profileImagePreview,
        photoURL: profileImagePreview,
        lastUpdated: new Date().toISOString(),
      })

      // Update local state
      setUserProfile((prev) =>
        prev
          ? {
            ...prev,
            displayName,
            profileImage: profileImagePreview,
            photoURL: profileImagePreview,
          }
          : null,
      )

      toast.success("Profile updated successfully!")
    } catch (error: unknown) {
      console.error("Error updating profile:", error)
      const message = error instanceof Error ? error.message : "Failed to update profile"
      toast.error(message)
    } finally {
      setIsUpdating(false)
    }
  }

  
const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (!file || !user) return

  // Validate file type
  if (!file.type.startsWith("image/")) {
    toast.error("Please select a valid image file")
    return
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error("Image size should be less than 5MB")
    return
  }

  setIsUploadingImage(true)

  try {
    // Get Firebase ID token
    const token = await user.getIdToken()

    // Upload to API route
    const formData = new FormData()
    formData.append("file", file)
    formData.append("token", token)

    const res = await fetch("/api/upload-profile-image", {
      method: "POST",
      body: formData,
    })
    if (!res.ok) throw new Error("Upload failed")
    const data = await res.json()
    const url = data.url

    // Update preview immediately
    setProfileImagePreview(url)

    // Update Firebase Auth profile
    await updateProfile(user, { photoURL: url })

    // Update Firestore user doc
    const userDocRef = doc(db, "users", user.uid)
    await updateDoc(userDocRef, {
      profileImage: url,
      photoURL: url,
      lastUpdated: new Date().toISOString(),
    })

    // Update local state
    setUserProfile((prev) =>
      prev ? { ...prev, profileImage: url, photoURL: url } : null
    )

    toast.success("Profile image updated successfully!")
  } catch (error: unknown) {
    console.error("Error uploading image:", error)
    toast.error(error instanceof Error ? error.message : "Failed to upload image")
  } finally {
    setIsUploadingImage(false)
  }
}

  const handleRemoveImage = async () => {
    if (!user) return

    setIsUploadingImage(true)
    try {
      // Clear the preview
      setProfileImagePreview("")

      // Update Firebase Auth profile
      await updateProfile(user, { photoURL: null })

      // Update Firestore document
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        profileImage: null,
        photoURL: null,
        lastUpdated: new Date().toISOString(),
      })

      // Update local state
      setUserProfile((prev) =>
        prev
          ? {
            ...prev,
            profileImage: undefined,
            photoURL: undefined,
          }
          : null,
      )

      toast.success("Profile image removed successfully!")
    } catch (error: unknown) {
      console.error("Error removing image:", error)
      const message = error instanceof Error ? error.message : "Failed to remove image"
      toast.error(message)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handlePasswordUpdate = async () => {
    if (!user || !user.email) return

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsUpdating(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Password updated successfully!")
    } catch (error: unknown) {
      console.error("Error updating password:", error)
      const message = error instanceof Error ? error.message : "Failed to update password"
      toast.error(message)
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const getDaysRemaining = (expirationDate: string | null) => {
    if (!expirationDate) return 0
    const expiry = new Date(expirationDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const getUserInitials = () => {
    const name = userProfile?.displayName || user?.displayName || user?.email || "User"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4 sm:p-6">
      <Toaster position="top-right" />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header with User Info */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-6 space-y-4 sm:space-y-0 mb-6">
            <div className="relative mb-2 sm:mb-0">
              <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-lg">
                <AvatarImage src={profileImagePreview || "/placeholder.svg"} alt="Profile" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 bg-primary hover:bg-primary/90 shadow-lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
            <div className="text-center sm:text-left w-full">
              <h1 className="text-2xl sm:text-4xl font-bold text-primary break-words">
                {userProfile?.displayName || user?.displayName || "User"}
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-1 break-words">{user?.email}</p>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-3">
                <Badge variant="outline">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified Account
                </Badge>
                {subscriptionData?.isActive && (
                  <Badge variant="default">
                    <CreditCard className="h-3 w-3 mr-1" />
                    {subscriptionData.activePlan}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Card className="border-2 border-primary/10 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-blue-500/5 border-b">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Security</span>
                </TabsTrigger>
                <TabsTrigger value="subscription" className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Subscription</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-8">
            <Tabs value={activeTab} className="w-full">
              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-semibold text-[#130F4D] dark:text-white mb-6 flex items-center">
                        <User className="h-6 w-6 mr-2" />
                        Profile Information
                      </h3>
                    </div>

                    {/* Profile Image Section */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl">
                      <Avatar className="h-20 w-20 border-4 border-primary/20">
                        <AvatarImage src={profileImagePreview || "/placeholder.svg"} alt="Profile" />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-primary mb-2">Profile Picture</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Upload a new profile picture. Recommended size: 400x400px, max 5MB.
                        </p>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingImage}
                            variant="outline"
                          >
                            {isUploadingImage ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Change Picture
                              </>
                            )}
                          </Button>
                          {profileImagePreview && (
                            <Button
                              onClick={handleRemoveImage}
                              disabled={isUploadingImage}
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 bg-transparent"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="displayName" className="text-base font-medium">
                          Display Name
                        </Label>
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Enter your display name"
                          className="h-12 border-2 border-gray-200 focus:border-[#130F4D] dark:border-gray-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-base font-medium">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="email"
                            value={email}
                            disabled
                            className="h-12 pl-10 bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Email cannot be changed from settings</p>
                      </div>
                    </div>

                    {/* Account Information */}
                    <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        Account Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Account Created:</span>
                          <p className="text-[#130F4D] dark:text-white font-semibold">
                            {user?.metadata?.creationTime
                              ? new Date(user.metadata.creationTime).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Last Sign In:</span>
                          <p className="text-[#130F4D] dark:text-white font-semibold">
                            {user?.metadata?.lastSignInTime
                              ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />
                    <Button
                      onClick={handleProfileUpdate}
                      disabled={isUpdating}
                      className="w-full sm:w-auto bg-gradient-to-r from-[#130F4D] to-blue-600 hover:from-[#0F0B3E] hover:to-blue-700 text-white px-8 py-3 h-12 text-base font-semibold shadow-lg"
                    >
                      <Save className="h-5 w-5 mr-2" />
                      {isUpdating ? "Updating..." : "Save Changes"}
                    </Button>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-semibold text-[#130F4D] dark:text-white mb-6 flex items-center">
                        <Lock className="h-6 w-6 mr-2" />
                        Security Settings
                      </h3>
                    </div>

                    <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center space-x-3 mb-3">
                        <Shield className="h-6 w-6 text-amber-600" />
                        <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300">Password Security</h3>
                      </div>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        Keep your account secure by using a strong password and updating it regularly.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-base font-medium">
                          Current Password
                        </Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="h-12 border-2 border-gray-200 focus:border-[#130F4D] dark:border-gray-600"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-base font-medium">
                            New Password
                          </Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="h-12 border-2 border-gray-200 focus:border-[#130F4D] dark:border-gray-600"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-base font-medium">
                            Confirm New Password
                          </Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="h-12 border-2 border-gray-200 focus:border-[#130F4D] dark:border-gray-600"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />
                    <Button
                      onClick={handlePasswordUpdate}
                      disabled={isUpdating || !currentPassword || !newPassword || !confirmPassword}
                    >
                      <Lock className="h-5 w-5 mr-2" />
                      {isUpdating ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Subscription Tab */}
              <TabsContent value="subscription" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-semibold text-[#130F4D] dark:text-white mb-6 flex items-center">
                        <CreditCard className="h-6 w-6 mr-2" />
                        Subscription Details
                      </h3>
                    </div>

                    {subscriptionData ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                            <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center">
                              <CreditCard className="h-5 w-5 mr-2" />
                              Current Plan
                            </h3>
                            <div className="flex items-center space-x-2 mt-3">
                              {subscriptionData.activePlan ? (
                                <Badge
                                  variant="default"
                                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 text-base"
                                >
                                  {subscriptionData.activePlan}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="px-4 py-2 text-base">
                                  No Active Plan
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Resume Credits</h3>
                            <p className="text-3xl font-bold text-[#130F4D] dark:text-white mt-3">
                              {subscriptionData.resumeLimit === 999999 ? "∞" : subscriptionData.resumeLimit}
                            </p>
                            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">analyses remaining</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-6 bg-background rounded-xl border border-muted-foreground">
                            <h3 className="font-semibold text-muted-foreground mb-2">
                              Subscription Date
                            </h3>
                            <p className="text-lg font-semibold text-primary mt-3">
                              {formatDate(subscriptionData.subscriptionDate)}
                            </p>
                          </div>
                          <div className="p-6 bg-background rounded-xl border border-muted-foreground">
                            <h3 className="font-semibold text-muted-foreground mb-2">Days Remaining</h3>
                            <p className="text-3xl font-bold text-primary mt-3">
                              {subscriptionData.expirationDate
                                ? getDaysRemaining(subscriptionData.expirationDate)
                                : "∞"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">days left</p>
                          </div>
                        </div>

                        <div className="p-6 bg-background rounded-xl border">
                          <h3 className="font-semibold text-muted-foreground mb-4 flex items-center">
                            <Shield className="h-5 w-5 mr-2" />
                            Subscription Status
                          </h3>
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-4 h-4 rounded-full ${subscriptionData.isActive ? "bg-green-500" : "bg-red-500"
                                }`}
                            ></div>
                            <span className="text-lg font-semibold text-primary">
                              {subscriptionData.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          {subscriptionData.expirationDate && (
                            <p className="text-sm text-muted-foreground mt-3">
                              Expires on: {formatDate(subscriptionData.expirationDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="p-6 bg-background rounded-xl border">
                          <CreditCard className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                          <h3 className="text-xl font-semibold text-muted-foreground mb-3">
                            No Subscription Found
                          </h3>
                          <p className="text-muted-foreground mb-6">
                            You do not have an active subscription yet.
                          </p>
                        </div>
                      </div>
                    )}

                    <Separator />
                    <div className="flex space-x-4">
                      <Button
                        onClick={() => (window.location.href = "/dashboard/subscription")}
                        className="px-8 py-3 h-12 text-base font-semibold shadow-lg"
                      >
                        <CreditCard className="h-5 w-5 mr-2" />
                        {subscriptionData?.isActive ? "Upgrade Plan" : "Subscribe Now"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default SettingsPage
