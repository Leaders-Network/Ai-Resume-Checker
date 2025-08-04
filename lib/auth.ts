import { db, realtimeDb } from "@/config/firebase"
import type { User } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { ref, set, get } from "firebase/database"

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  profileImage?: string
  createdAt: string
  lastLoginAt: string
  trialStartDate?: string
  trialEndDate?: string
}

export interface SubscriptionData {
  activePlan: string | null
  resumeLimit: number
  subscriptionDate: string | null
  expirationDate: string | null
  isActive: boolean
  trialStartDate?: string | null
  trialEndDate?: string | null
  isTrialActive?: boolean
  paymentReference?: string
}

export const createUserProfile = async (user: User, additionalData?: any) => {
  if (!user) return

  const userRef = doc(db, "users", user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    const { displayName, email, photoURL } = user
    const createdAt = new Date().toISOString()
    const trialStartDate = new Date().toISOString()
    const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now

    try {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: displayName || email?.split("@")[0] || "User",
        email,
        photoURL,
        createdAt,
        lastLoginAt: createdAt,
        trialStartDate,
        trialEndDate,
        ...additionalData,
      })

      // Initialize subscription data with 7-day trial
      await initializeUserSubscription(user.uid, trialStartDate, trialEndDate)
      console.log("Creating user profile for:", user.uid)
    } catch (error) {
      console.error("Error creating user profile:", error)
    }
  } else {
    // Update last login
    await setDoc(
      userRef,
      {
        lastLoginAt: new Date().toISOString(),
      },
      { merge: true },
    )
  }
}

export const initializeUserSubscription = async (userId: string, trialStartDate?: string, trialEndDate?: string) => {
  const subscriptionRef = ref(realtimeDb, `subscriptions/${userId}`)
  const snapshot = await get(subscriptionRef)

  if (!snapshot.exists()) {
    const now = new Date()
    const trialStart = trialStartDate || now.toISOString()
    const trialEnd = trialEndDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const isTrialActive = new Date(trialEnd) > now

    const initialSubscription: SubscriptionData = {
      activePlan: "Free Trial",
      resumeLimit: 999999, // Unlimited during trial
      subscriptionDate: trialStart,
      expirationDate: trialEnd,
      isActive: isTrialActive,
      trialStartDate: trialStart,
      trialEndDate: trialEnd,
      isTrialActive,
    }
    await set(subscriptionRef, initialSubscription)
  }
}

export const updateUserSubscription = async (userId: string, subscriptionData: Partial<SubscriptionData>) => {
  const subscriptionRef = ref(realtimeDb, `subscriptions/${userId}`)
  const currentData = await get(subscriptionRef)
  const updatedData = {
    ...currentData.val(),
    ...subscriptionData,
    lastUpdated: new Date().toISOString(),
  }
  await set(subscriptionRef, updatedData)
}

export const getUserSubscription = async (userId: string): Promise<SubscriptionData | null> => {
  const subscriptionRef = ref(realtimeDb, `subscriptions/${userId}`)
  const snapshot = await get(subscriptionRef)

  if (snapshot.exists()) {
    const data = snapshot.val()

    // Check if trial has expired
    if (data.trialEndDate && data.isTrialActive) {
      const now = new Date()
      const trialEnd = new Date(data.trialEndDate)

      if (now > trialEnd) {
        // Trial has expired, update subscription
        const updatedData = {
          ...data,
          isTrialActive: false,
          isActive: false,
          activePlan: "Free",
          resumeLimit: 3,
        }
        await set(subscriptionRef, updatedData)
        return updatedData
      }
    }

    return data
  }
  return null
}

export const checkFeatureAccess = (subscriptionData: SubscriptionData | null, feature: string): boolean => {
  if (!subscriptionData) return false

  // During trial, all features are available
  if (subscriptionData.isTrialActive) return true

  // After trial, check subscription status
  if (!subscriptionData.isActive) {
    // Free plan restrictions
    return feature === "basic"
  }

  // Paid plans have access to all features
  return true
}
