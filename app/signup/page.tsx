"use client"
import type React from "react"
import { useState, useRef } from "react"
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth"
import { auth, provider, facebookProvider } from "@/config/firebase"
import { createUserProfile } from "@/lib/auth"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"
import Link from "next/link"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook, FaEye, FaEyeSlash, FaCamera, FaUser } from "react-icons/fa"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/config/firebase"
import Image from "next/image"


//

const Signup = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
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

      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
    // Get current user token
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    const token = await currentUser.getIdToken(true)

    // Upload via API route to avoid CORS issues
    const formData = new FormData()
    formData.append('file', file)
    formData.append('token', token)

    const response = await fetch('/api/upload-profile-image', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const { url } = await response.json()
    return url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[handleSubmit] Form submitted")

    if (password !== confirmPassword) {
      console.warn("[handleSubmit] Passwords do not match")
      toast.error("Passwords don't match")
      return
    }

    if (password.length < 6) {
      console.warn("[handleSubmit] Password too short")
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    console.time("[handleSubmit] Total signup time")

    try {
      console.log("[handleSubmit] Creating Firebase user...")
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      console.log("[handleSubmit] User created:", user.uid)

      // Create user profile first without image
      console.log("[handleSubmit] Creating Firestore user profile...")
      await createUserProfile(user, {
        displayName: name,
      })
      console.log("[handleSubmit] Firestore profile created")

      // Update Firebase Auth profile with display name
      await updateProfile(user, {
        displayName: name,
      })

      // Upload image in background if provided (non-blocking)
      if (profileImage) {
        uploadProfileImageInBackground(user.uid, profileImage)
      }

      toast.success("Account created successfully!")
      router.push("/dashboard")
    } catch (error: unknown) {
      console.error("[handleSubmit] Signup error:", error)
      const message = error instanceof Error ? error.message : "Failed to create account"
      toast.error(message)
    } finally {
      console.timeEnd("[handleSubmit] Total signup time")
      setIsLoading(false)
    }
  }

  // Background image upload function (non-blocking)
  const uploadProfileImageInBackground = async (userId: string, file: File) => {
    try {
      console.log("[uploadProfileImageInBackground] Starting background upload")
      const photoURL = await uploadProfileImage(userId, file)

      // Update user profile with image URL
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL })

        // Update Firestore
        const userDocRef = doc(db, "users", userId)
        await updateDoc(userDocRef, {
          profileImage: photoURL,
          photoURL: photoURL,
          lastUpdated: new Date().toISOString(),
        })

        console.log("[uploadProfileImageInBackground] Background upload completed")
      }
    } catch (error) {
      console.error("[uploadProfileImageInBackground] Background upload failed:", error)
      // Don't show error to user since account was already created successfully
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      await createUserProfile(user)
      toast.success("Signed up with Google!")
      router.push("/dashboard")
    } catch (error: unknown) {
      console.error(error)
      const message = error instanceof Error ? error.message : "Failed to sign up with Google"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFacebookLogin = async () => {
    setIsLoading(true)
    try {
      const result = await signInWithPopup(auth, facebookProvider)
      const user = result.user
      await createUserProfile(user)
      toast.success("Signed up with Facebook!")
      router.push("/dashboard")
    } catch (error: unknown) {
      console.error(error)
      const message = error instanceof Error ? error.message : "Failed to sign up with Facebook"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
      <Toaster position="top-right" />

      {/* Background with gradient and floating shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-secondary/20">
        {/* Floating shapes */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary/20 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-secondary/30 rounded-full opacity-50 animate-bounce"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-accent/20 rounded-full opacity-40"></div>
        <div className="absolute bottom-40 right-10 w-32 h-20 bg-muted/30 rounded-2xl opacity-30 rotate-12"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="flex w-full max-w-4xl bg-card rounded-3xl shadow-2xl overflow-hidden border border-border">
          {/* Left side - Branding */}
          <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-background to-accent p-8 flex-col justify-center text-foreground relative">
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-2">IQ Resume</h1>
              <p className="text-muted-foreground mb-8">Excellent online builder</p>

              <h2 className="text-2xl font-semibold mb-4">Create your account</h2>
              <p className="text-muted-foreground mb-8">
                Join our platform to access powerful resume analysis and building tools.
              </p>

              <div className="mt-auto text-center">
                <p className="text-muted-foreground">Already have an account?</p>
                <Link href="/signin" className="text-primary hover:text-primary/80 font-medium">
                  Sign in
                </Link>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="w-full md:w-1/2 p-8 flex items-center justify-center bg-card">
            <div className="w-full max-w-md">
              <h2 className="text-2xl font-bold text-center text-foreground mb-6">Sign Up</h2>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div
                      className="w-24 h-24 rounded-full bg-input border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {profileImagePreview ? (
                        <Image
                          src={profileImagePreview}
                          alt="Profile Preview"
                          fill
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUser className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                      accept="image/*"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 hover:bg-primary/90"
                      disabled={isLoading}
                    >
                      <FaCamera className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-foreground mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2 bg-input text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-foreground mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 bg-input text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-foreground mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password (min. 6 characters)"
                      className="w-full px-3 py-2 pr-10 bg-input text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={isLoading}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-foreground mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full px-3 py-2 pr-10 bg-input text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creating account..." : "Sign up"}
                </button>
              </form>

              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">OR</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-2 border border-border rounded-xl hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    <FcGoogle className="w-4 h-4 mr-2" />
                    <span className="text-foreground font-medium">Continue with Google</span>
                  </button>
                  <button
                    onClick={handleFacebookLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-2 border border-border rounded-xl hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    <FaFacebook className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="text-foreground font-medium">Continue with Facebook</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  By clicking &quot;Sign up&quot;, you agree to our{" "}
                  <Link href="/terms" className="text-primary hover:text-primary/80">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:text-primary/80">
                    Privacy Policy
                  </Link>
                </p>
              </div>

              <div className="mt-4 text-center md:hidden">
                <p className="text-muted-foreground">Already have an account?</p>
                <Link href="/signin" className="text-primary hover:text-primary/80 font-medium">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup