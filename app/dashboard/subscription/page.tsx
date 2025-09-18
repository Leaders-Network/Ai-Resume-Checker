"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Crown,
  Check,
  X,
  CreditCard,
  Calendar,
  Users,
  Zap,
  Star,
  Shield,
  Sparkles,
  TrendingUp,
  Infinity,
} from "lucide-react"
import { motion } from "framer-motion"
import { toast, Toaster } from "react-hot-toast"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/config/firebase"
import { doc, getDoc } from "firebase/firestore"
import { getUserSubscription, updateUserSubscription, type SubscriptionData } from "@/lib/auth"
import { LucideIcon } from 'lucide-react'

interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  profileImage?: string
  createdAt: string
  lastLoginAt: string
}

interface PricingPlan {
  id: string
  name: string
  price: number
  period: string
  resumeLimit: number
  features: string[]
  popular?: boolean
  icon: LucideIcon
  color: string
  gradient: string
}


export default function SubscriptionPage() {
  const [user] = useAuthState(auth)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)

  useEffect(() => {

    const loadUserProfile = async () => {
      if (!user) return
      try {
        const userDocRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userDocRef)
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile)
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
      loadUserProfile()
      loadSubscriptionData()
    }
    setLoading(false)

    // Load Paystack script
    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [user])

  const getUserInitials = () => {
    const name = userProfile?.displayName || user?.displayName || user?.email || "User"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const pricingPlans: PricingPlan[] = [
    {
      id: "basic",
      name: "Basic",
      price: 3500, // ₦3,500
      period: "month",
      resumeLimit: 10,
      features: [
        "10 resume analyses per month",
        "Basic keyword matching",
        "Score overview",
        "PDF viewer",
        "Email support",
        "Resume comparison",
      ],
      icon: Users,
      color: "text-gray-600",
      gradient: "from-gray-50 to-gray-100",
    },
    {
      id: "pro",
      name: "Professional",
      price: 7500, // ₦7,500
      period: "month",
      resumeLimit: 50,
      features: [
        "50 resume analyses per month",
        "Advanced keyword matching",
        "Detailed analytics & insights",
        "AI-powered suggestions",
        "Resume comparison tools",
        "Data visualization",
        "Priority email support",
        "Export capabilities",
      ],
      popular: true,
      icon: Crown,
      color: "text-blue-600",
      gradient: "from-blue-50 to-indigo-100",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 39500, // ₦39,500
      period: "month",
      resumeLimit: -1, // Unlimited
      features: [
        "Unlimited resume analyses",
        "Advanced AI recommendations",
        "Custom keyword categories",
        "Bulk processing",
        "Team collaboration tools",
        "Advanced reporting",
        "API access",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom integrations",
      ],
      icon: Sparkles,
      color: "text-purple-600",
      gradient: "from-purple-50 to-pink-100",
    },
  ]

  const initializePaystack = (plan: PricingPlan) => {
    if (!user || !userProfile) {
      toast.error("Please complete your profile first")
      return
    }

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY 
      email: user.email,
      amount: plan.price * 100, // Paystack expects amount in kobo
      currency: "NGN",
      ref: `${plan.id}_${user.uid}_${Date.now()}`,
      metadata: {
        custom_fields: [
          {
            display_name: "Plan",
            variable_name: "plan",
            value: plan.name,
          },
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: user.uid,
          },
        ],
      },
      callback: (response) => {
        // Payment successful
        handlePaymentSuccess(plan, response.reference)
      },
      onClose: () => {
        toast.error("Payment cancelled")
        setProcessingPlan(null)
      },
    })

    handler.openIframe()
  }

  const handlePaymentSuccess = async (plan: PricingPlan, reference: string) => {
    try {
      // Verify payment on your backend (you should implement this)
      // For now, we'll simulate successful verification

      toast.success("Payment successful! Activating your subscription...")

      // Update subscription data
      const newSubscriptionData: SubscriptionData = {
        isActive: true,
        activePlan: plan.name,
        resumeLimit: plan.resumeLimit === -1 ? 999999 : plan.resumeLimit,
        subscriptionDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paymentReference: reference,
        isTrialActive: false, // End trial when user pays
        trialEndDate: null,
      }

      await updateUserSubscription(user!.uid, newSubscriptionData)
      setSubscriptionData(newSubscriptionData)

      toast.success("Subscription activated successfully!")
    } catch (error) {
      console.error("Error activating subscription:", error)
      toast.error("Failed to activate subscription. Please contact support.")
    } finally {
      setProcessingPlan(null)
    }
  }

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error("Please sign in to subscribe")
      return
    }

    const plan = pricingPlans.find((p) => p.id === planId)
    if (!plan) return

    setProcessingPlan(planId)

    if (typeof window !== "undefined" && window.PaystackPop) {
      initializePaystack(plan)
    } else {
      toast.error("Payment system not loaded. Please refresh and try again.")
      setProcessingPlan(null)
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

  const getTrialDaysRemaining = () => {
    if (!subscriptionData?.trialEndDate) return 0
    const now = new Date()
    const trialEnd = new Date(subscriptionData.trialEndDate)
    const diffTime = trialEnd.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-12 w-12 border-4 border-[#130F4D] border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading subscription details...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Toaster />
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header with User Info */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-16 w-16 border-4 border-[#130F4D]/20 shadow-lg">
                  <AvatarImage
                    src={userProfile?.profileImage || userProfile?.photoURL || user?.photoURL || ""}
                    alt="Profile"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-[#130F4D] to-blue-600 text-white text-lg font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                {(subscriptionData?.isActive || subscriptionData?.isTrialActive) && (
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1">
                    <Crown className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#130F4D] dark:text-white">Subscription Plans</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Choose the perfect plan for your resume analysis needs
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {subscriptionData?.isTrialActive ? "Free Trial" : subscriptionData?.activePlan || "Free"}
                  </Badge>
                  {subscriptionData?.isTrialActive && (
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                    >
                      {getTrialDaysRemaining()} days left
                    </Badge>
                  )}
                  {(subscriptionData?.isActive || subscriptionData?.isTrialActive) && (
                    <Badge variant="secondary" className="bg-[#130F4D] text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium User
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Credits Remaining</p>
                <p className="text-2xl font-bold text-[#130F4D] dark:text-white">
                  {subscriptionData?.resumeLimit === 999999 ? "∞" : subscriptionData?.resumeLimit || 0}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trial Status Card */}
        {subscriptionData?.isTrialActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="border-2 border-orange-300 dark:border-orange-600 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-900/30">
                <CardTitle className="text-xl flex items-center">
                  <Crown className="h-6 w-6 mr-2 text-orange-600" />
                  Free Trial Active
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
                    <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {getTrialDaysRemaining()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Days Remaining</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                    <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">All Features</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Unlocked</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                    <Infinity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">Unlimited</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Resume Credits</div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg">
                  <p className="text-center text-orange-700 dark:text-orange-300">
                    <Star className="h-4 w-4 inline mr-2" />
                    Your trial expires on {formatDate(subscriptionData?.trialEndDate ?? null)}. Upgrade now to continue enjoying
                    premium features!
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Current Subscription Status */}
        {subscriptionData && subscriptionData.isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="border-2 border-[#130F4D]/10 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#130F4D]/5 to-blue-500/5">
                <CardTitle className="text-xl flex items-center">
                  <CreditCard className="h-6 w-6 mr-2 text-[#130F4D]" />
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                    <Crown className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {subscriptionData.activePlan || "Free"}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Current Plan</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                    <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {subscriptionData.resumeLimit === 999999 ? "∞" : subscriptionData.resumeLimit}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Resume Credits</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                    <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {subscriptionData.expirationDate ? getDaysRemaining(subscriptionData.expirationDate) : "∞"}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Days Remaining</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">Active</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                  </div>
                </div>
                {subscriptionData.expirationDate && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                    <p className="text-center text-blue-700 dark:text-blue-300">
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Your subscription expires on {formatDate(subscriptionData.expirationDate)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {pricingPlans.map((plan) => {
            const IconComponent = plan.icon
            const isCurrentPlan = subscriptionData?.activePlan === plan.name
            const isProcessing = processingPlan === plan.id

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden border-2 shadow-lg hover:shadow-xl transition-all duration-300 ${plan.popular
                  ? "border-[#130F4D] scale-105 shadow-2xl"
                  : "border-gray-200 dark:border-gray-700 hover:border-[#130F4D]/50"
                  } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#130F4D] to-blue-600 text-white text-center py-2 text-sm font-semibold">
                    <Star className="h-4 w-4 inline mr-1" />
                    Most Popular
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center py-2 text-sm font-semibold">
                    <Check className="h-4 w-4 inline mr-1" />
                    Current Plan
                  </div>
                )}

                <CardHeader
                  className={`pb-2 ${plan.popular || isCurrentPlan ? "pt-12" : "pt-6"} bg-gradient-to-br ${plan.gradient} dark:from-gray-800 dark:to-gray-700`}
                >
                  <div className="text-center">
                    <div className={`p-3 bg-white dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 shadow-lg`}>
                      <IconComponent className={`h-10 w-10 ${plan.color} mx-auto mt-1`} />
                    </div>
                    <CardTitle className="text-2xl font-bold text-[#130F4D] dark:text-white">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-[#130F4D] dark:text-white">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">/{plan.period}</span>
                    </div>
                    <div className="mt-2">
                      <Badge
                        variant="secondary"
                        className="bg-white/50 text-[#130F4D] dark:bg-gray-700 dark:text-white"
                      >
                        {plan.resumeLimit === -1 ? "Unlimited" : `${plan.resumeLimit} resumes`}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-3">
                        <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full h-12 text-base font-semibold shadow-md transition-all duration-300 ${isCurrentPlan
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : plan.popular
                        ? "bg-gradient-to-r from-[#130F4D] to-blue-600 hover:from-[#0F0B3E] hover:to-blue-700 text-white"
                        : "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white"
                      }`}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrentPlan || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Current Plan
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12"
        >
          <Card className="border-2 border-[#130F4D]/10 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#130F4D]/5 to-blue-500/5">
              <CardTitle className="text-xl text-center">Feature Comparison</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-4 px-4 font-semibold text-[#130F4D] dark:text-white">Features</th>
                      {pricingPlans.map((plan) => (
                        <th
                          key={plan.id}
                          className="text-center py-4 px-4 font-semibold text-[#130F4D] dark:text-white"
                        >
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Resume Analyses</td>
                      <td className="text-center py-4 px-4">10</td>
                      <td className="text-center py-4 px-4">50/month</td>
                      <td className="text-center py-4 px-4">
                        <Infinity className="h-5 w-5 mx-auto text-purple-600" />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">AI Suggestions</td>
                      <td className="text-center py-4 px-4">
                        <Check className="h-5 w-5 mx-auto text-green-500" />
                      </td>
                      <td className="text-center py-4 px-4">
                        <Check className="h-5 w-5 mx-auto text-green-500" />
                      </td>
                      <td className="text-center py-4 px-4">
                        <Check className="h-5 w-5 mx-auto text-green-500" />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">Data Visualization</td>
                      <td className="text-center py-4 px-4">
                        <Check className="h-5 w-5 mx-auto text-green-500" />
                      </td>
                      <td className="text-center py-4 px-4">
                        <Check className="h-5 w-5 mx-auto text-green-500" />
                      </td>
                      <td className="text-center py-4 px-4">
                        <Check className="h-5 w-5 mx-auto text-green-500" />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-4 font-medium">API Access</td>
                      <td className="text-center py-4 px-4">
                        <X className="h-5 w-5 mx-auto text-red-500" />
                      </td>
                      <td className="text-center py-4 px-4">
                        <X className="h-5 w-5 mx-auto text-red-500" />
                      </td>
                      <td className="text-center py-4 px-4">
                        <Check className="h-5 w-5 mx-auto text-green-500" />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-medium">Support</td>
                      <td className="text-center py-4 px-4 text-sm">Email</td>
                      <td className="text-center py-4 px-4 text-sm">Priority Email</td>
                      <td className="text-center py-4 px-4 text-sm">24/7 Phone</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12"
        >
          <Card className="border-2 border-[#130F4D]/10 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#130F4D]/5 to-blue-500/5">
              <CardTitle className="text-xl text-center">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-[#130F4D] dark:text-white mb-2">Can I change my plan anytime?</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#130F4D] dark:text-white mb-2">What happens to unused credits?</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Unused credits roll over to the next month for all paid plans.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#130F4D] dark:text-white mb-2">Is there a free trial?</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Yes, all new users get a 7-day free trial with unlimited access to all features.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#130F4D] dark:text-white mb-2">How secure is my data?</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    We use enterprise-grade security and never share your resume data with third parties.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Features Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 overflow-x-auto"
        >
          <Card className="border-2 border-[#130F4D]/10 shadow-lg min-w-[350px]">
            <CardHeader className="bg-gradient-to-r from-[#130F4D]/5 to-blue-500/5">
              <CardTitle className="text-xl text-center">Feature Comparison</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                {/* ...existing table code... */}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12"
        >
          <Card className="border-2 border-[#130F4D]/10 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#130F4D]/5 to-blue-500/5">
              <CardTitle className="text-xl text-center">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* ...existing FAQ code... */}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
