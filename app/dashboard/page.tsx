"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Upload, Trash2, Loader2, FileText, CheckCircle, Lightbulb, User, Crown } from "lucide-react"
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist"
import { useRouter } from "next/navigation"
import { useSpring, animated } from "react-spring"
import { useTheme } from "next-themes"
import toast, { Toaster } from "react-hot-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { auth, db } from "@/config/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { doc, getDoc } from "firebase/firestore"
import { getUserSubscription, updateUserSubscription, checkFeatureAccess, type SubscriptionData } from "@/lib/auth"
import { signOut } from "firebase/auth"

// PDF.js worker setup
GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs"

interface KeywordCategory {
  skills: string[]
  experience: string[]
  location: string[]
  certification: string[]
}

interface UserProfile {
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

// Common skills for auto-extraction
const commonSkills = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c++",
  "c#",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "react",
  "angular",
  "vue",
  "node.js",
  "express",
  "django",
  "flask",
  "spring",
  "laravel",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "terraform",
  "jenkins",
  "git",
  "github",
  "mongodb",
  "mysql",
  "postgresql",
  "sql",
  "nosql",
  "redis",
  "elasticsearch",
  "machine learning",
  "artificial intelligence",
  "data science",
  "big data",
  "data analysis",
  "html",
  "css",
  "sass",
  "less",
  "bootstrap",
  "tailwind",
  "material ui",
  "figma",
  "sketch",
  "agile",
  "scrum",
  "kanban",
  "jira",
  "confluence",
  "project management",
  "team leadership",
  "communication",
  "problem solving",
  "critical thinking",
  "creativity",
  "collaboration",
]

// Common certifications for auto-extraction
const commonCertifications = [
  "aws certified",
  "azure certified",
  "google cloud certified",
  "comptia",
  "cisco certified",
  "pmp",
  "scrum master",
  "itil",
  "cisa",
  "cissp",
  "ceh",
  "ccna",
  "ccnp",
  "mcsa",
  "mcse",
  "oracle certified",
  "ibm certified",
  "salesforce certified",
  "red hat certified",
]

const extractTextFromPDF = async (file: File) => {
  const fileReader = new FileReader()
  return new Promise<string>((resolve, reject) => {
    fileReader.onload = async (e) => {
      try {
        const pdfData = new Uint8Array(e.target?.result as ArrayBuffer)
        const pdf = await getDocument(pdfData).promise
        let textContent = ""
        for (let i = 0; i < pdf.numPages; i++) {
          const page = await pdf.getPage(i + 1)
          const text = await page.getTextContent()
          textContent += text.items.map((item: any) => item.str).join(" ")
        }
        resolve(textContent)
      } catch (error) {
        reject(error)
      }
    }
    fileReader.readAsArrayBuffer(file)
  })
}

// Function to extract keywords from resume text
const extractKeywords = (text: string) => {
  const lowerText = text.toLowerCase()
  const extractedKeywords = {
    skills: [] as string[],
    experience: [] as string[],
    location: [] as string[],
    certification: [] as string[],
  }

  // Extract skills
  commonSkills.forEach((skill) => {
    if (lowerText.includes(skill.toLowerCase())) {
      extractedKeywords.skills.push(skill)
    }
  })

  // Extract certifications
  commonCertifications.forEach((cert) => {
    if (lowerText.includes(cert.toLowerCase())) {
      extractedKeywords.certification.push(cert)
    }
  })

  // Extract experience
  const experienceRegex = /(\d+)[\s-]*(?:to|-)?[\s-]*(\d+)?\s*(?:year|yr)s?|(\d+)\+\s*(?:year|yr)s?/gi
  const matches = [...lowerText.matchAll(experienceRegex)]
  if (matches.length > 0) {
    const match = matches[0]
    if (match[3]) {
      const years = Number.parseInt(match[3])
      if (years >= 5) {
        extractedKeywords.experience.push("5+ years")
      } else if (years >= 3) {
        extractedKeywords.experience.push("3-5 years")
      } else if (years >= 1) {
        extractedKeywords.experience.push("1-3 years")
      } else {
        extractedKeywords.experience.push("0-1 years")
      }
    }
  }

  // Extract locations
  const commonLocations = [
    "new york",
    "san francisco",
    "los angeles",
    "chicago",
    "boston",
    "seattle",
    "austin",
    "london",
    "paris",
    "berlin",
    "tokyo",
    "sydney",
    "toronto",
    "vancouver",
    "singapore",
    "remote",
    "usa",
    "uk",
    "canada",
    "australia",
    "germany",
    "france",
    "japan",
    "china",
    "india",
  ]

  commonLocations.forEach((location) => {
    if (lowerText.includes(location.toLowerCase())) {
      extractedKeywords.location.push(location)
    }
  })

  return extractedKeywords
}

export default function DashboardPage() {
  const { theme } = useTheme()
  const [user, loading] = useAuthState(auth)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [files, setFiles] = useState<any[]>([])
  const [keywords, setKeywords] = useState<KeywordCategory>(() => {
    if (typeof window !== "undefined") {
      const savedKeywords = sessionStorage.getItem("keywords")
      return savedKeywords ? JSON.parse(savedKeywords) : { skills: [], experience: [], location: [], certification: [] }
    }
    return { skills: [], experience: [], location: [], certification: [] }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestedKeywords, setSuggestedKeywords] = useState<KeywordCategory>({
    skills: [],
    experience: [],
    location: [],
    certification: [],
  })
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const keywordInputRefs = useRef<{ [key in keyof KeywordCategory]: HTMLInputElement | null }>({
    skills: null,
    experience: null,
    location: null,
    certification: null,
  })
  const router = useRouter()

  const fileAnimation = useSpring({
    opacity: files.length ? 1 : 0,
    transform: files.length ? "translateY(0)" : "translateY(20px)",
    config: { tension: 180, friction: 12 },
  })

  useEffect(() => {
    if (user) {
      loadUserProfile()
      loadSubscriptionData()
    }
  }, [user])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("keywords", JSON.stringify(keywords))
    }
  }, [keywords])

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

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/signin")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Failed to sign out")
    }
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

  const categoryLabels: { [key in keyof KeywordCategory]: string } = {
    skills: "Skills",
    experience: "Experience",
    location: "Location",
    certification: "Certifications",
  }

  const canUploadResumes = () => {
    if (!subscriptionData) return false
    // Check if trial is active or user has paid subscription
    if (subscriptionData.isTrialActive || subscriptionData.isActive) {
      return (subscriptionData.resumeLimit || 0) > 0
    }
    // Free plan after trial
    return (subscriptionData.resumeLimit || 0) > 0
  }

  const getRemainingDays = () => {
    if (!subscriptionData?.trialEndDate) return 0
    const now = new Date()
    const trialEnd = new Date(subscriptionData.trialEndDate)
    const diffTime = trialEnd.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  // Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (canUploadResumes()) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (!canUploadResumes()) {
      toast.error("🚀 You've reached your resume limit. Subscribe to continue uploading.", {
        duration: 5000,
      })
      return
    }

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => file.type === "application/pdf")
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles)
    } else {
      toast.error("⚠ Please drop only PDF files.")
    }
  }

  const processFiles = async (uploadedFiles: File[]) => {
    const uniqueFiles = uploadedFiles.filter(
      (file) => !files.some((existingFile) => existingFile.fileName === file.name),
    )

    if (uniqueFiles.length === 0) {
      toast.error("⚠ No new or valid files selected.")
      return
    }

    try {
      const processedFiles = await Promise.all(
        uniqueFiles.map(async (file) => {
          try {
            const content = await extractTextFromPDF(file)
            const extractedKeywords = extractKeywords(content)

            // Only show suggestions if user has access to advanced features
            if (checkFeatureAccess(subscriptionData, "advanced")) {
              setSuggestedKeywords((prev) => ({
                skills: [...new Set([...prev.skills, ...extractedKeywords.skills])],
                experience: [...new Set([...prev.experience, ...extractedKeywords.experience])],
                location: [...new Set([...prev.location, ...extractedKeywords.location])],
                certification: [...new Set([...prev.certification, ...extractedKeywords.certification])],
              }))

              if (
                extractedKeywords.skills.length > 0 ||
                extractedKeywords.experience.length > 0 ||
                extractedKeywords.location.length > 0 ||
                extractedKeywords.certification.length > 0
              ) {
                setShowSuggestions(true)
              }
            }

            const fileBlob = new Blob([file], { type: file.type })
            const fileUrl = URL.createObjectURL(fileBlob)

            return {
              fileName: file.name,
              url: fileUrl,
              content,
              file,
              blob: fileBlob,
            }
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error)
            return null
          }
        }),
      )

      const validFiles = processedFiles.filter(Boolean)
      setFiles((prevFiles) => [...prevFiles, ...validFiles])

      // Update subscription data
      if (user && subscriptionData) {
        const updatedLimit = (subscriptionData.resumeLimit || 0) - uniqueFiles.length
        await updateUserSubscription(user.uid, { resumeLimit: updatedLimit })
        setSubscriptionData((prev) => (prev ? { ...prev, resumeLimit: updatedLimit } : null))
      }

      toast.success("✅ Files uploaded successfully!")
    } catch (error) {
      toast.error("❌ Failed to process files.")
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []).filter((file) => file.type === "application/pdf")

    if (!canUploadResumes()) {
      toast.error("🚀 You've reached your resume limit. Subscribe to continue uploading.", {
        duration: 5000,
      })
      return
    }

    if (uploadedFiles.length > 0) {
      await processFiles(uploadedFiles)
    }
  }

  const handleFileDelete = (index: number) => {
    setFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter((_, i) => i !== index)
      return updatedFiles
    })
    toast.success("🗑️ File deleted successfully.")
  }

  const handleKeywordInput = (category: keyof KeywordCategory, e: React.KeyboardEvent<HTMLInputElement>) => {
    const inputValue = e.currentTarget.value.trim()
    if (e.key === "Enter" && inputValue !== "") {
      setKeywords((prev) => ({
        ...prev,
        [category]: [...prev[category], inputValue],
      }))
      if (keywordInputRefs.current[category]) {
        keywordInputRefs.current[category]!.value = ""
      }
    }
  }

  const KeywordDisplay = ({ category }: { category: keyof KeywordCategory }) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {keywords[category].map((keyword, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#130F4D] dark:bg-[#130F4D] text-white dark:text-white"
        >
          {keyword}
          <button
            onClick={() => handleDeleteKeyword(category, keyword, index)}
            className="ml-2 text-red-300 hover:text-red-100"
          >
            ×
          </button>
        </Badge>
      ))}
    </div>
  )

  const handleExperienceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value
    if (selectedValue) {
      setKeywords((prev) => ({
        ...prev,
        experience: [selectedValue],
      }))
    }
  }

  const handleDeleteKeyword = (category: keyof KeywordCategory, keywordToDelete: string, index: number) => {
    setKeywords((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, idx) => idx !== index),
    }))
    toast.success(`Keyword removed successfully`, {
      duration: 2000,
      position: "top-right",
    })
  }

  const handleAddSuggestedKeyword = (category: keyof KeywordCategory, keyword: string) => {
    if (!checkFeatureAccess(subscriptionData, "advanced")) {
      toast.error("🔒 Upgrade to access AI suggestions!")
      return
    }

    if (!keywords[category].includes(keyword)) {
      setKeywords((prev) => ({
        ...prev,
        [category]: [...prev[category], keyword],
      }))
      setSuggestedKeywords((prev) => ({
        ...prev,
        [category]: prev[category].filter((k) => k !== keyword),
      }))
      toast.success(`Added "${keyword}" to ${categoryLabels[category]}`, {
        duration: 2000,
        position: "top-right",
      })
    }
  }

  const handleAddAllSuggestions = () => {
    if (!checkFeatureAccess(subscriptionData, "advanced")) {
      toast.error("🔒 Upgrade to access AI suggestions!")
      return
    }

    setKeywords((prev) => {
      const newKeywords = { ...prev }
      Object.keys(suggestedKeywords).forEach((category) => {
        const typedCategory = category as keyof KeywordCategory
        suggestedKeywords[typedCategory].forEach((keyword) => {
          if (!newKeywords[typedCategory].includes(keyword)) {
            newKeywords[typedCategory] = [...newKeywords[typedCategory], keyword]
          }
        })
      })
      return newKeywords
    })

    setSuggestedKeywords({ skills: [], experience: [], location: [], certification: [] })
    setShowSuggestions(false)
    toast.success("Added all suggested keywords", {
      duration: 2000,
      position: "top-right",
    })
  }

  const navigateToResults = async () => {
    if (files.length === 0) {
      toast.error("📄 Please upload at least one resume to analyze", {
        duration: 3000,
        position: "top-right",
      })
      return
    }

    const missingCategories = []
    if (keywords.skills.length === 0) missingCategories.push("Skills")
    if (keywords.experience.length === 0) missingCategories.push("Experience")
    if (keywords.location.length === 0) missingCategories.push("Location")
    if (keywords.certification.length === 0) missingCategories.push("Certifications")

    if (missingCategories.length > 0) {
      toast.error(`🔑 Add keywords for: ${missingCategories.join(", ")}`, {
        duration: 3000,
        position: "top-right",
      })
      return
    }

    setIsLoading(true)
    const allKeywords = [...keywords.skills, ...keywords.experience, ...keywords.location, ...keywords.certification]

    const filesWithKeywords = files.map((file) => {
      const matches = allKeywords.filter((keyword) => {
        if (keywords.experience.includes(keyword)) {
          if (keyword === "1-3 years") {
            const regex =
              /\b([1-3]|one|two|three)[\s-]*(year|yr)s?\b|\b([1-3]|one|two|three)[\s-]*to[\s-]*([1-3]|one|two|three)[\s-]*(year|yr)s?\b/i
            return regex.test(file.content)
          } else if (keyword === "3-5 years") {
            const regex =
              /\b([3-5]|three|four|five)[\s-]*(year|yr)s?\b|\b([3-5]|three|four|five)[\s-]*to[\s-]*([3-5]|three|four|five)[\s-]*(year|yr)s?\b|\b(3|three)\+[\s-]*(year|yr)s?\b/i
            return regex.test(file.content)
          } else if (keyword === "5+ years") {
            const regex =
              /\b([5-9]|[1-9][0-9]+|five|six|seven|eight|nine|ten)[\s-]*(year|yr)s?\b|\b([5-9]|[1-9][0-9]+|five|six|seven|eight|nine|ten)\+[\s-]*(year|yr)s?\b/i
            return regex.test(file.content)
          } else if (keyword === "0-1 years") {
            const regex =
              /\b(0|1|zero|one)[\s-]*(year|yr)s?\b|\b(0|zero)[\s-]*to[\s-]*(1|one)[\s-]*(year|yr)s?\b|\bless than (1|one)[\s-]*(year|yr)s?\b/i
            return regex.test(file.content)
          }
          return file.content.toLowerCase().includes(keyword.toLowerCase())
        }
        return file.content.toLowerCase().includes(keyword.toLowerCase())
      })

      const missing = allKeywords.filter((keyword) => !matches.includes(keyword))

      const categoryMatches = {
        skills:
          (keywords.skills.filter((keyword) => file.content.toLowerCase().includes(keyword.toLowerCase())).length /
            Math.max(1, keywords.skills.length)) *
          100,
        experience:
          (keywords.experience.filter((keyword) => {
            if (keyword === "1-3 years") {
              const regex =
                /\b([1-3]|one|two|three)[\s-]*(year|yr)s?\b|\b([1-3]|one|two|three)[\s-]*to[\s-]*([1-3]|one|two|three)[\s-]*(year|yr)s?\b/i
              return regex.test(file.content)
            } else if (keyword === "3-5 years") {
              const regex =
                /\b([3-5]|three|four|five)[\s-]*(year|yr)s?\b|\b([3-5]|three|four|five)[\s-]*to[\s-]*([3-5]|three|four|five)[\s-]*(year|yr)s?\b|\b(3|three)\+[\s-]*(year|yr)s?\b/i
              return regex.test(file.content)
            } else if (keyword === "5+ years") {
              const regex =
                /\b([5-9]|[1-9][0-9]+|five|six|seven|eight|nine|ten)[\s-]*(year|yr)s?\b|\b([5-9]|[1-9][0-9]+|five|six|seven|eight|nine|ten)\+[\s-]*(year|yr)s?\b/i
              return regex.test(file.content)
            } else if (keyword === "0-1 years") {
              const regex =
                /\b(0|1|zero|one)[\s-]*(year|yr)s?\b|\b(0|zero)[\s-]*to[\s-]*(1|one)[\s-]*(year|yr)s?\b|\bless than (1|one)[\s-]*(year|yr)s?\b/i
              return regex.test(file.content)
            }
            return file.content.toLowerCase().includes(keyword.toLowerCase())
          }).length /
            Math.max(1, keywords.experience.length)) *
          100,
        location:
          (keywords.location.filter((keyword) => file.content.toLowerCase().includes(keyword.toLowerCase())).length /
            Math.max(1, keywords.location.length)) *
          100,
        certification:
          (keywords.certification.filter((keyword) => file.content.toLowerCase().includes(keyword.toLowerCase()))
            .length /
            Math.max(1, keywords.certification.length)) *
          100,
      }

      return {
        ...file,
        matches,
        missing,
        score: (matches.length / allKeywords.length) * 100 || 0,
        categoryScores: categoryMatches,
      }
    })

    if (typeof window !== "undefined") {
      sessionStorage.setItem("resumes", JSON.stringify(filesWithKeywords))
      sessionStorage.setItem("keywordCategories", JSON.stringify(keywords))
    }

    await toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
      loading: "🔍 Analyzing resumes...",
      success: "✅ Analysis complete!",
      error: "❌ Analysis failed!",
    })

    setIsLoading(false)
    router.push("/dashboard/result")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#130F4D]"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-6">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header with user info */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-[#130F4D]/20 shadow-lg">
                  <AvatarImage
                    src={userProfile?.profileImage || userProfile?.photoURL || user?.photoURL || ""}
                    alt="Profile"
                  />
                  <AvatarFallback className="bg-[#130F4D] text-white text-xl font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                {(subscriptionData?.isActive || subscriptionData?.isTrialActive) && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                  Welcome back, {userProfile?.displayName || user?.displayName || "User"}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">Ready to analyze some resumes today?</p>
                <div className="flex items-center space-x-3 mt-3">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  >
                    <User className="h-3 w-3 mr-1" />
                    {subscriptionData?.isTrialActive ? "Free Trial" : subscriptionData?.activePlan || "Free"}
                  </Badge>
                  {subscriptionData?.isTrialActive && (
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                    >
                      {getRemainingDays()} days left
                    </Badge>
                  )}
                  {(subscriptionData?.isActive || subscriptionData?.isTrialActive) && (
                    <Badge variant="secondary" className="bg-orange-600 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium Features
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats Cards */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {subscriptionData?.resumeLimit === 999999 ? "∞" : subscriptionData?.resumeLimit || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-800 dark:text-blue-200 font-medium text-lg">Resume Credits</p>
                <p className="text-sm text-blue-600/80 dark:text-blue-300/80">Remaining analyses</p>
                <div className="mt-3 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(((subscriptionData?.resumeLimit || 0) / 100) * 100, 100)}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-700 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {files.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-800 dark:text-purple-200 font-medium text-lg">Uploaded Resumes</p>
                <p className="text-sm text-purple-600/80 dark:text-purple-300/80">Ready for analysis</p>
                <div className="mt-3 flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-purple-600 dark:text-purple-400">
                    {files.length > 0 ? "Files ready" : "No files uploaded"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {Object.values(keywords).flat().length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-800 dark:text-green-200 font-medium text-lg">Keywords</p>
                <p className="text-sm text-green-600/80 dark:text-green-300/80">Added for matching</p>
                <div className="mt-3 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    {Object.values(keywords).flat().length > 0 ? "Keywords configured" : "No keywords added"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Trial Expiry Warning */}
        {subscriptionData?.isTrialActive && getRemainingDays() <= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Card className="border-2 border-orange-300 dark:border-orange-600 shadow-lg">
              <CardHeader className="pb-2 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30">
                <CardTitle className="flex items-center text-orange-800 dark:text-orange-300">
                  <Crown className="mr-2 h-5 w-5" />
                  Trial Ending Soon
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-orange-700 dark:text-orange-400 mb-4">
                  Your free trial expires in {getRemainingDays()} days. Upgrade now to continue enjoying all premium
                  features!
                </p>
                <Button
                  onClick={() => router.push("/dashboard/subscription")}
                  className="bg-gradient-to-r from-[#130F4D] to-blue-600 hover:from-[#0F0B3E] hover:to-blue-700 text-white"
                >
                  🚀 Upgrade Now
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {showSuggestions && checkFeatureAccess(subscriptionData, "advanced") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Card className="border-2 border-amber-300 dark:border-amber-600 shadow-lg">
              <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30">
                <CardTitle className="flex items-center text-amber-800 dark:text-amber-300">
                  <Lightbulb className="mr-2 h-5 w-5" />
                  AI Suggested Keywords
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {Object.keys(suggestedKeywords).map((category) => {
                    const typedCategory = category as keyof KeywordCategory
                    const suggestions = suggestedKeywords[typedCategory]
                    if (suggestions.length === 0) return null

                    return (
                      <div key={category} className="space-y-2">
                        <h3 className="font-medium">{categoryLabels[typedCategory]}</h3>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map((keyword, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="cursor-pointer bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-800/50 transition-colors"
                              onClick={() => handleAddSuggestedKeyword(typedCategory, keyword)}
                            >
                              + {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" onClick={() => setShowSuggestions(false)}>
                      Dismiss
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleAddAllSuggestions}
                      className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                    >
                      Add All Suggestions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-2 border-[#130F4D]/10 h-full shadow-lg">
              <CardHeader className="pb-2 bg-gradient-to-r from-[#130F4D]/5 to-blue-500/5">
                <CardTitle className="flex items-center text-xl">
                  <Upload className="mr-2 h-6 w-6 text-[#130F4D]" />
                  Upload Resumes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {!canUploadResumes() && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-center space-x-3 mb-3">
                      <Crown className="h-6 w-6 text-red-600" />
                      <h3 className="font-semibold text-red-800 dark:text-red-300">
                        {subscriptionData?.isTrialActive ? "Trial Limit Reached" : "Upgrade Required"}
                      </h3>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                      {subscriptionData?.isTrialActive
                        ? "You've used all your trial credits. Upgrade to continue analyzing resumes."
                        : "You've reached your resume limit. Upgrade to continue analyzing resumes."}
                    </p>
                    <Button
                      onClick={() => router.push("/dashboard/subscription")}
                      className="bg-gradient-to-r from-[#130F4D] to-blue-600 hover:from-[#0F0B3E] hover:to-blue-700 text-white"
                    >
                      🚀 Upgrade to Premium
                    </Button>
                  </div>
                )}

                <div
                  onClick={() => canUploadResumes() && fileInputRef.current?.click()}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-4 border-dashed rounded-xl p-8 cursor-pointer bg-gradient-to-br transition-all duration-300 ${
                    canUploadResumes()
                      ? isDragOver
                        ? "border-green-500 dark:border-green-400 from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 scale-105 shadow-lg"
                        : "border-[#130F4D] dark:border-gray-600 from-[#F0F4F7] to-blue-50 dark:from-gray-700 dark:to-gray-600 hover:border-[#0f0d40] hover:shadow-lg"
                      : "border-gray-300 dark:border-gray-700 from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 cursor-not-allowed opacity-50"
                  }`}
                >
                  <Upload
                    className={`mx-auto h-16 w-16 mb-4 ${
                      canUploadResumes()
                        ? isDragOver
                          ? "text-green-600 dark:text-green-400"
                          : "text-[#130F4D] dark:text-white"
                        : "text-gray-400"
                    }`}
                  />
                  <p
                    className={`text-center text-lg font-medium ${
                      canUploadResumes()
                        ? isDragOver
                          ? "text-green-700 dark:text-green-300"
                          : "text-[#130F4D] dark:text-white"
                        : "text-gray-500"
                    }`}
                  >
                    {canUploadResumes()
                      ? isDragOver
                        ? "Drop PDF files here!"
                        : "Drag & drop PDF files or click to upload"
                      : "Upgrade to upload resumes"}
                  </p>
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {canUploadResumes()
                      ? "Supports PDF files up to 10MB each • Multiple files supported"
                      : "Premium feature required"}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    multiple
                    onChange={handleFileUpload}
                    disabled={!canUploadResumes()}
                  />
                </div>

                <animated.ul style={fileAnimation} className="mt-6 space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {files.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-4 bg-[#130F4D] dark:from-gray-700 dark:to-gray-600 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <FileText className="h-5 w-5 mr-3 text-white flex-shrink-0" />
                        <span className="text-white dark:text-white truncate font-medium">{file.fileName}</span>
                      </div>
                      <button
                        onClick={() => handleFileDelete(index)}
                        className="text-red-300 hover:text-red-100 ml-3 p-1 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </animated.ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-2 border-[#130F4D]/10 h-full shadow-lg">
              <CardHeader className="pb-2 bg-gradient-to-r from-[#130F4D]/5 to-blue-500/5">
                <CardTitle className="flex items-center text-xl">
                  <CheckCircle className="mr-2 h-6 w-6 text-[#130F4D]" />
                  Keywords
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {Object.keys(categoryLabels).map((category) => (
                    <div key={category} className="space-y-3">
                      <label className="block text-lg font-semibold text-[#130F4D] dark:text-gray-300">
                        {categoryLabels[category as keyof KeywordCategory]}
                      </label>
                      {category === "experience" ? (
                        <>
                          <select
                            onChange={handleExperienceSelect}
                            className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-lg p-3 dark:bg-gray-700 dark:text-white focus:border-[#130F4D] transition-colors"
                          >
                            <option value="">Select Experience Level</option>
                            <option value="0-1 years">0-1 years</option>
                            <option value="1-3 years">1-3 years</option>
                            <option value="3-5 years">3-5 years</option>
                            <option value="5+ years">5+ years</option>
                          </select>
                          <KeywordDisplay category={category as keyof KeywordCategory} />
                        </>
                      ) : (
                        <>
                          <div className="flex space-x-2">
                            <Input
                              ref={(el) => (keywordInputRefs.current[category as keyof KeywordCategory] = el)}
                              type="text"
                              placeholder={`Enter ${categoryLabels[category as keyof KeywordCategory]} and press Enter`}
                              onKeyDown={(e) => handleKeywordInput(category as keyof KeywordCategory, e)}
                              className="w-full h-12 border-2 border-gray-200 dark:border-gray-600 focus:border-[#130F4D] dark:bg-gray-700 dark:text-white transition-colors"
                            />
                          </div>
                          <KeywordDisplay category={category as keyof KeywordCategory} />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <Button
            onClick={navigateToResults}
            disabled={isLoading}
            className="w-full bg-orange-600 dark:text-white hover:bg-orange-400  text-white py-4 rounded-xl text-xl font-bold h-16 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-3 inline-block h-6 w-6" />
                Processing Resumes...
              </>
            ) : (
              <>
                <CheckCircle className="mr-3 inline-block h-6 w-6 " />
                Analyze Resumes
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
