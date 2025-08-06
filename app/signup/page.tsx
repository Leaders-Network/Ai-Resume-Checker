"use client"
import type React from "react"
import { useState, useRef } from "react"
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth"
import { auth, provider, facebookProvider, storage } from "@/config/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { createUserProfile } from "@/lib/auth"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"
import Link from "next/link"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook, FaEye, FaEyeSlash, FaCamera, FaUser } from "react-icons/fa"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/config/firebase"

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
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const fileName = `profile-${timestamp}.${fileExtension}`

    const imageRef = ref(storage, `profile-images/${userId}/${fileName}`)
    const snapshot = await uploadBytes(imageRef, file)
    return await getDownloadURL(snapshot.ref)
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
    } catch (error: any) {
      console.error("[handleSubmit] Signup error:", error)
      toast.error(error.message || "Failed to create account")
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
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to sign up with Google")
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
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to sign up with Facebook")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen relative overflow-hidden bg-background text-foreground">
      <Toaster position="top-right" />
      
      {/* Background with gradient and floating shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-secondary/20">
        {/* Floating shapes with theme colors */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary/20 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-secondary/30 rounded-full opacity-50 animate-bounce"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-accent/20 rounded-full opacity-40"></div>
        <div className="absolute bottom-40 right-10 w-32 h-20 bg-muted/30 rounded-2xl opacity-30 rotate-12"></div>
        <div className="absolute top-1/2 left-1/4 w-28 h-28 bg-primary/10 rounded-full opacity-20"></div>
        <div className="absolute top-20 right-1/3 w-12 h-20 bg-secondary/20 rounded-xl opacity-40 rotate-45"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 h-full flex items-center justify-center p-4">
        <div className="flex w-full max-w-5xl bg-card rounded-3xl shadow-2xl overflow-hidden h-[90vh] border border-border">
          {/* Left side - Branding */}
          <div className="hidden md:flex md:w-2/5 bg-gradient-to-br from-background to-accent p-6 flex-col justify-center text-foreground relative">
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-2">IQ Resume</h1>
              <p className="text-muted-foreground mb-6">Excellent online builder</p>
              <h2 className="text-xl font-semibold mb-3">Create your best resume right now</h2>
              <p className="text-muted-foreground mb-6">{"100k+ users already have most professional resume"}</p>
            </div>
            <div className="mt-auto">
              <p className="text-muted-foreground">Already have an account?</p>
              <Link href="/signin" className="text-primary hover:text-primary/80 font-medium">
                Sign in
              </Link>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-10 right-10 w-16 h-16 bg-primary/30 rounded-full opacity-20"></div>
            <div className="absolute bottom-20 right-20 w-12 h-12 bg-secondary/40 rounded-full opacity-30"></div>
          </div>

          {/* Right side - Sign up form */}
          <div className="w-full md:w-3/5 p-6 overflow-y-auto bg-card">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-6">Sign up</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Profile Image Upload */}
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-muted border-2 border-border flex items-center justify-center overflow-hidden">
                      {profileImagePreview ? (
                        <img
                          src={profileImagePreview || "/placeholder.svg"}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUser className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
                      disabled={isLoading}
                    >
                      <FaCamera className="w-3 h-3" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nancy Johnson"
                    className="w-full px-3 py-2 bg-input text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nancyjon@gmail.com"
                    className="w-full px-3 py-2 bg-input text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                    Set password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3 py-2 pr-10 bg-input text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full px-3 py-2 pr-10 bg-input text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50"
                  >
                    <FaFacebook className="w-4 h-4 mr-2" />
                    <span className="font-medium">Continue with Facebook</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  By clicking "Sign up", you agree to our{" "}
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
  )
}

export default Signup