"use client"

import type React from "react"
import { useState } from "react"
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth"
import { auth, provider, facebookProvider } from "@/config/firebase"
import { createUserProfile } from "@/lib/auth"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"
import Link from "next/link"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook, FaEye, FaEyeSlash } from "react-icons/fa"

const Signin = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      await createUserProfile(userCredential.user)
      toast.success("Signed in successfully!")
      router.push("/dashboard")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to sign in")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const result = await signInWithPopup(auth, provider)
      await createUserProfile(result.user)
      toast.success("Signed in with Google!")
      router.push("/dashboard")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to sign in with Google")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFacebookLogin = async () => {
    setIsLoading(true)
    try {
      const result = await signInWithPopup(auth, facebookProvider)
      await createUserProfile(result.user)
      toast.success("Signed in with Facebook!")
      router.push("/dashboard")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to sign in with Facebook")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
      <Toaster position="top-right" />

      {/* Background with gradient and floating shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-secondary/20">
        {/* Floating shapes - updated with theme colors */}
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

              <h2 className="text-2xl font-semibold mb-4">Welcome back to your account</h2>
              <p className="text-muted-foreground mb-8">
                Sign in to continue managing your professional profile and career opportunities.
              </p>

              <div className="mt-auto text-center">
                <p className="text-muted-foreground">Don't have an account?</p>
                <Link href="/signup" className="text-primary hover:text-primary/80 font-medium">
                  Sign up
                </Link>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="w-full md:w-1/2 p-8 flex items-center justify-center bg-card">
            <div className="w-full max-w-md">
              <h2 className="text-2xl font-bold text-center text-foreground mb-6">Sign In</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 bg-input text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 pr-12 bg-input text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">OR</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-3 border border-border rounded-xl hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    <FcGoogle className="w-5 h-5 mr-3" />
                    <span className="text-foreground font-medium">Continue with Google</span>
                  </button>

                  <button
                    onClick={handleFacebookLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-3 border border-border rounded-xl hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    <FaFacebook className="w-5 h-5 mr-3 text-blue-600" />
                    <span className="text-foreground font-medium">Continue with Facebook</span>
                  </button>
                </div>
              </div>

              <div className="mt-8 text-center md:hidden">
                <p className="text-muted-foreground">Don't have an account?</p>
                <Link href="/signup" className="text-primary hover:text-primary/80 font-medium">
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signin