import { db, auth } from "@/config/firebase"
import type { User } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { billingRequest } from "@/lib/billing-client"
import type { SubscriptionData } from "@/lib/subscription-model"
export type { SubscriptionData } from "@/lib/subscription-model"

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

export const createUserProfile = async (user: User, additionalData?: Partial<UserProfile>) => {
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
      await initializeUserSubscription(user.uid)
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

export const initializeUserSubscription = async (userId: string) => { await getUserSubscription(userId); };
export const getUserSubscription = async (userId: string): Promise<SubscriptionData | null> => {
  if (auth.currentUser?.uid !== userId) throw new Error("Please sign in.");
  return (await billingRequest("/api/subscription")).subscription;
};

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
