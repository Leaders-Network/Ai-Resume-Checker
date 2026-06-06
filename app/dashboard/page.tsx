"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Upload, Trash2, Loader2, FileText, CheckCircle, Lightbulb, User, Crown, CreditCard, Files, Tag, Zap, Clock, MapPin, Award, Download, Sparkles as SparkleIcon } from "lucide-react"
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { auth, db } from "@/config/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { doc, getDoc, getDocs, setDoc, collection, deleteDoc } from "firebase/firestore"
import { getUserSubscription, updateUserSubscription, checkFeatureAccess, type SubscriptionData } from "@/lib/auth"
// import { signOut } from "firebase/auth"
import { useDarkMode } from "@/app/context/DarkModeContext";
// import { TextItem } from "pdfjs-dist/types/src/display/api"

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

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  uploadDate: Date
  status: 'uploading' | 'completed' | 'error'
  fileName?: string
  content?: string
  file?: File
  blob?: Blob
  publicId?: string
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
          textContent += text.items.map((item: Record<string, unknown>) => item.str).join(" ")
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

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return { text: "Good morning", emoji: "☀️" }
  if (hour < 17) return { text: "Good afternoon", emoji: "🌤️" }
  return { text: "Good evening", emoji: "🌙" }
}

export default function DashboardPage() {
  const { isDarkMode } = useDarkMode();
  const [user, loading] = useAuthState(auth)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [currentFiles, setCurrentFiles] = useState<UploadedFile[]>([])
  const [previousFiles, setPreviousFiles] = useState<UploadedFile[]>([])
  const [keywords, setKeywords] = useState<KeywordCategory>(() => {
    if (typeof window !== "undefined") {
      const savedKeywords = sessionStorage.getItem("keywords")
      return savedKeywords ? JSON.parse(savedKeywords) : { skills: [], experience: [], location: [], certification: [] }
    }
    return { skills: [], experience: [], location: [], certification: [] }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
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

  // const fileAnimation = useSpring({
  //   opacity: files.length ? 1 : 0,
  //   transform: files.length ? "translateY(0)" : "translateY(20px)",
  //   config: { tension: 180, friction: 12 },
  // })


  async function saveResumeMetadata(userId: string, fileData: {
    name: string;
    url: string;
    publicId: string;
    analysis: string;
    uploadedAt: Date;
  }) {
    const docRef = doc(collection(db, "users", userId, "resumes"));
    await setDoc(docRef, {
      ...fileData,
      uploadedAt: fileData.uploadedAt.toISOString(),
    });
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("keywords", JSON.stringify(keywords))
    }
  }, [keywords])





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

    if (!user) return;
    const fetchPreviousResumes = async () => {
      const resumesCollectionRef = collection(db, "users", user.uid, "resumes");
      const querySnapshot = await getDocs(resumesCollectionRef);
      const resumes = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          url: data.url,
          publicId: data.publicId,
          uploadDate: new Date(data.uploadedAt),
          ...data,
        };
      });
      // Ensure each resume has all required UploadedFile fields
      const formattedResumes = resumes.map((resume) => ({
        id: resume.id,
        name: resume.name,
        url: resume.url,
        publicId: resume.publicId,
        uploadDate: resume.uploadDate,
        size: 0,
        type: "application/pdf",
        status: "completed",
      }));
      setPreviousFiles(formattedResumes as UploadedFile[]);
    };
    fetchPreviousResumes();

    if (user) {
      loadUserProfile()
      loadSubscriptionData()
    }
  }, [user])




  //handle sign out unused
  // const handleSignOut = async () => {
  //   try {
  //     await signOut(auth)
  //     router.push("/signin")
  //   } catch (error) {
  //     console.error("Error signing out:", error)
  //     toast.error("Failed to sign out")
  //   }
  // }

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
      (file) => !currentFiles.some((existingFile) => (existingFile.fileName ?? existingFile.name) === file.name),
    );

    if (uniqueFiles.length === 0) {
      toast.error("⚠ No new or valid files selected.");
      return;
    }


    try {
      setIsUploading(true);
      const processedFiles: Array<UploadedFile | null> = await Promise.all(
        uniqueFiles.map(async (file) => {
          try {
            // 1. Upload to Cloudinary via API route
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload-pdf", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              throw new Error("Failed to upload file to storage");
            }

            const { url: fileUrl, public_id: publicId } = await response.json();

            // 2. Extract content for keyword suggestions
            const content = await extractTextFromPDF(file);
            const extractedKeywords = extractKeywords(content);

            // Only show suggestions if user has access to advanced features
            if (checkFeatureAccess(subscriptionData, "advanced")) {
              setSuggestedKeywords((prev) => ({
                skills: [...new Set([...prev.skills, ...extractedKeywords.skills])],
                experience: [...new Set([...prev.experience, ...extractedKeywords.experience])],
                location: [...new Set([...prev.location, ...extractedKeywords.location])],
                certification: [...new Set([...prev.certification, ...extractedKeywords.certification])],
              }));

              if (
                extractedKeywords.skills.length > 0 ||
                extractedKeywords.experience.length > 0 ||
                extractedKeywords.location.length > 0 ||
                extractedKeywords.certification.length > 0
              ) {
                setShowSuggestions(true);
              }
            }

            const fileBlob = new Blob([file], { type: file.type });

            // 3. Save metadata to Firestore
            if (user) {
              await saveResumeMetadata(user.uid, {
                name: file.name,
                url: fileUrl,
                publicId: publicId,
                analysis: JSON.stringify(extractedKeywords),
                uploadedAt: new Date(),
              });
            }

            return {
              id: `${file.name}-${Date.now()}`,
              name: file.name,
              size: file.size,
              type: file.type,
              uploadDate: new Date(),
              status: 'completed',
              url: fileUrl,
              publicId: publicId,
              fileName: file.name,
              content,
              file,
              blob: fileBlob,
            };
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            return null;
          }
        }),
      );

      const validFiles = processedFiles.filter((f): f is UploadedFile => f !== null);
      setCurrentFiles((prevFiles) => [...prevFiles, ...validFiles]);

      // Update subscription data
      if (user && subscriptionData) {
        const updatedLimit = (subscriptionData.resumeLimit || 0) - uniqueFiles.length;
        await updateUserSubscription(user.uid, { resumeLimit: updatedLimit });
        setSubscriptionData((prev) => (prev ? { ...prev, resumeLimit: updatedLimit } : null));
      }
      toast.success("✅ Files uploaded successfully!");
    } catch (error) {
      toast.error(`❌ Failed to process files. ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

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
    setCurrentFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter((_, i) => i !== index)
      return updatedFiles
    })
    toast.success("🗑️ File deleted successfully.")
  }

  const handlePreviousFileDelete = async (fileId: string, publicId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete files.")
      return
    }

    const confirmation = window.confirm(`Are you sure you want to delete this file?`)
    if (!confirmation) return

    try {
      // 1. Delete from Cloudinary if publicId exists
      if (publicId) {
        const token = await user.getIdToken(true) // force refresh so token isn't stale
        const response = await fetch("/api/upload-pdf", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, publicId }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.warn(`Cloudinary delete failed (${response.status}):`, errorData)
          // Proceed to delete from Firestore anyway so the user isn't stuck with a ghost file
        }
      }

      // 2. Delete from Firestore
      try {
        const resumeDocRef = doc(db, "users", user.uid, "resumes", fileId)
        await deleteDoc(resumeDocRef)
      } catch (firestoreErr) {
        console.warn("Firestore delete warning (file may already be removed):", firestoreErr)
        // Don't throw — Cloudinary delete already succeeded
      }

      // 3. Update UI state
      setPreviousFiles((prevFiles) => prevFiles.filter((f) => f.id !== fileId))
      toast.success("File deleted successfully!")
    } catch (error) {
      console.error("Error deleting file:", error)
      toast.error(error instanceof Error ? error.message : "An unknown error occurred")
    }
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
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${isDarkMode
            ? "bg-primary/90 text-primary-foreground"
            : "bg-primary/90 text-primary-foreground"
            }`}
        >
          {keyword}
          <button
            onClick={() => handleDeleteKeyword(category, keyword, index)}
            className="ml-2 text-primary-foreground/70 hover:text-primary-foreground"
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
    if (currentFiles.length === 0) {
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

    const filesWithKeywords = currentFiles.map((file) => {
      const fileContent = file.content ?? ""
      const matches = allKeywords.filter((keyword) => {
        if (keywords.experience.includes(keyword)) {
          if (keyword === "1-3 years") {
            const regex =
              /\b([1-3]|one|two|three)[\s-]*(year|yr)s?\b|\b([1-3]|one|two|three)[\s-]*to[\s-]*([1-3]|one|two|three)[\s-]*(year|yr)s?\b/i
            return regex.test(fileContent)
          } else if (keyword === "3-5 years") {
            const regex =
              /\b([3-5]|three|four|five)[\s-]*(year|yr)s?\b|\b([3-5]|three|four|five)[\s-]*to[\s-]*([3-5]|three|four|five)[\s-]*(year|yr)s?\b|\b(3|three)\+[\s-]*(year|yr)s?\b/i
            return regex.test(fileContent)
          } else if (keyword === "5+ years") {
            const regex =
              /\b([5-9]|[1-9][0-9]+|five|six|seven|eight|nine|ten)[\s-]*(year|yr)s?\b|\b([5-9]|[1-9][0-9]+|five|six|seven|eight|nine|ten)\+[\s-]*(year|yr)s?\b/i
            return regex.test(fileContent)
          } else if (keyword === "0-1 years") {
            const regex =
              /\b(0|1|zero|one)[\s-]*(year|yr)s?\b|\b(0|zero)[\s-]*to[\s-]*(1|one)[\s-]*(year|yr)s?\b|\bless than (1|one)[\s-]*(year|yr)s?\b/i
            return regex.test(fileContent)
          }
          return fileContent.toLowerCase().includes(keyword.toLowerCase())
        }
        return fileContent.toLowerCase().includes(keyword.toLowerCase())
      })

      const missing = allKeywords.filter((keyword) => !matches.includes(keyword))

      const categoryMatches = {
        skills:
          (keywords.skills.filter((keyword) => fileContent.toLowerCase().includes(keyword.toLowerCase())).length /
            Math.max(1, keywords.skills.length)) *
          100,
        experience:
          (keywords.experience.filter((keyword) => {
            if (keyword === "1-3 years") {
              const regex =
                /\b([1-3]|one|two|three)[\s-]*(year|yr)s?\b|\b([1-3]|one|two|three)[\s-]*to[\s-]*([1-3]|one|two|three)[\s-]*(year|yr)s?\b/i
              return regex.test(fileContent)
            } else if (keyword === "3-5 years") {
              const regex =
                /\b([3-5]|three|four|five)[\s-]*(year|yr)s?\b|\b([3-5]|three|four|five)[\s-]*to[\s-]*([3-5]|three|four|five)[\s-]*(year|yr)s?\b|\b(3|three)\+[\s-]*(year|yr)s?\b/i
              return regex.test(fileContent)
            } else if (keyword === "5+ years") {
              const regex =
                /\b([5-9]|[1-9][0-9]+|five|six|seven|eight|nine|ten)[\s-]*(year|yr)s?\b|\b([5-9]|[1-9][0-9]+|five|six|seven|eight|nine|ten)\+[\s-]*(year|yr)s?\b/i
              return regex.test(fileContent)
            } else if (keyword === "0-1 years") {
              const regex =
                /\b(0|1|zero|one)[\s-]*(year|yr)s?\b|\b(0|zero)[\s-]*to[\s-]*(1|one)[\s-]*(year|yr)s?\b|\bless than (1|one)[\s-]*(year|yr)s?\b/i
              return regex.test(fileContent)
            }
            return fileContent.toLowerCase().includes(keyword.toLowerCase())
          }).length /
            Math.max(1, keywords.experience.length)) *
          100,
        location:
          (keywords.location.filter((keyword) => fileContent.toLowerCase().includes(keyword.toLowerCase())).length /
            Math.max(1, keywords.location.length)) *
          100,
        certification:
          (keywords.certification.filter((keyword) => fileContent.toLowerCase().includes(keyword.toLowerCase()))
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

  // Merge currentFiles and previousFiles, avoiding duplicates by file name
const allFiles = [
  ...currentFiles,
  ...previousFiles.filter(
    prev =>
      !currentFiles.some(cur => (cur.fileName ?? cur.name) === (prev.fileName ?? prev.name))
  ),
];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen w-full p-3 sm:p-6 ${isDarkMode
      ? "bg-background"
      : "bg-gray-50"  // Light, clean background for light mode
      }`}>


      <Toaster position="top-right" reverseOrder={false} />
      <div className="max-w-7xl mx-auto">
        {/* ── Gradient Hero Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 ${
            isDarkMode
              ? "bg-gradient-to-br from-[hsl(200,30%,10%)] via-[hsl(200,28%,14%)] to-[hsl(28,40%,12%)] border border-border shadow-xl"
              : "bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 shadow-xl"
          }`}>
            {/* Background mesh pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
              backgroundSize: "40px 40px"
            }} />
            {/* Glowing orb accents */}
            <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex flex-col items-center sm:flex-row sm:items-center sm:space-x-6 space-y-3 sm:space-y-0 w-full">
                {/* Avatar with glow ring */}
                <div className="relative mb-2 sm:mb-0 flex-shrink-0">
                  <div className="animate-glow-ring rounded-full">
                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-white/30 shadow-2xl">
                      <AvatarImage
                        src={userProfile?.profileImage || userProfile?.photoURL || user?.photoURL || ""}
                        alt="Profile"
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg sm:text-xl font-bold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  {(subscriptionData?.isActive || subscriptionData?.isTrialActive) && (
                    <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-1 shadow-lg">
                      <Crown className="h-3 w-3 text-amber-900" />
                    </div>
                  )}
                </div>

                {/* Greeting text */}
                <div className="text-center sm:text-left w-full">
                  <p className="text-white/70 text-sm font-medium mb-0.5">
                    {getGreeting().emoji} {getGreeting().text}
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm">
                    {userProfile?.displayName || user?.displayName || "User"}!
                  </h1>
                  <p className="text-white/70 mt-1 text-sm sm:text-base">Ready to analyze some resumes today?</p>

                  {/* Status badges */}
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-sm border border-white/20">
                      <User className="h-3 w-3" />
                      {subscriptionData?.isTrialActive ? "Free Trial" : subscriptionData?.activePlan || "Free"}
                    </span>
                    {subscriptionData?.isTrialActive && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                        ⏳ {getRemainingDays()} days left
                      </span>
                    )}
                    {(subscriptionData?.isActive || subscriptionData?.isTrialActive) && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                        <Crown className="h-3 w-3" />
                        Premium Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Premium Stats Cards ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">

            {/* Card 1: Resume Credits */}
            <div className={`relative rounded-2xl p-5 overflow-hidden border-l-4 border-l-emerald-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-md ${isDarkMode ? "bg-card border-border" : "bg-white border-gray-100"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Resume Credits</p>
                  <p className="text-4xl font-extrabold text-foreground animate-count-in">
                    {subscriptionData?.resumeLimit === 999999 ? "∞" : subscriptionData?.resumeLimit || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Remaining analyses</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
              <div className="mt-4 w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(((subscriptionData?.resumeLimit || 0) / 100) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {subscriptionData?.resumeLimit ? `${subscriptionData.resumeLimit} of 100 remaining` : "No credits"}
              </p>
            </div>

            {/* Card 2: Uploaded Resumes */}
            <div className={`relative rounded-2xl p-5 overflow-hidden border-l-4 border-l-blue-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-md ${isDarkMode ? "bg-card border-border" : "bg-white border-gray-100"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Uploaded Resumes</p>
                  <p className="text-4xl font-extrabold text-foreground animate-count-in">
                    {currentFiles.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Ready for analysis</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                  <Files className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div className={`mt-4 flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-lg w-fit ${
                currentFiles.length > 0
                  ? "bg-blue-500/10 text-blue-500"
                  : "bg-muted text-muted-foreground"
              }`}>
                <FileText className="h-3.5 w-3.5" />
                {currentFiles.length > 0 ? `${currentFiles.length} file${currentFiles.length > 1 ? "s" : ""} ready` : "No files uploaded"}
              </div>
            </div>

            {/* Card 3: Keywords */}
            <div className={`relative rounded-2xl p-5 overflow-hidden border-l-4 border-l-violet-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-md ${isDarkMode ? "bg-card border-border" : "bg-white border-gray-100"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Keywords</p>
                  <p className="text-4xl font-extrabold text-foreground animate-count-in">
                    {Object.values(keywords).flat().length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Added for matching</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                  <Tag className="h-6 w-6 text-violet-500" />
                </div>
              </div>
              <div className={`mt-4 flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-lg w-fit ${
                Object.values(keywords).flat().length > 0
                  ? "bg-violet-500/10 text-violet-500"
                  : "bg-muted text-muted-foreground"
              }`}>
                <CheckCircle className="h-3.5 w-3.5" />
                {Object.values(keywords).flat().length > 0 ? "Keywords configured" : "No keywords added"}
              </div>
            </div>

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
            <Card className={`border-2 border-primary/30 shadow-lg ${isDarkMode ? 'bg-card' : 'bg-blue-50'}`}>
              <CardHeader className="pb-2 bg-primary/5">
                <CardTitle className={`flex items-center text-xl ${isDarkMode ? 'text-card-foreground' : 'text-blue-800'}`}>
                  <Crown className="mr-2 h-5 w-5" />
                  Trial Ending Soon
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-card-foreground mb-4">
                  Your free trial expires in {getRemainingDays()} days. Upgrade now to continue enjoying all premium
                  features!
                </p>
                <Button
                  onClick={() => router.push("/dashboard/subscription")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Upgrade Now
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
            <Card className={`shadow-lg border ${isDarkMode ? 'border-border bg-card' : 'border-gray-200 bg-blue-50'}`}>
              <CardHeader className="pb-2 bg-secondary/5">
                <CardTitle className={`flex items-center text-xl ${isDarkMode ? 'text-card-foreground' : 'text-blue-800'}`}>
                  <Lightbulb className={`mr-2 h-6 w-6 ${isDarkMode ? 'text-primary' : 'text-blue-500'}`} />
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
                        <h3 className={`font-medium text-lg ${isDarkMode ? 'text-gray-200' : 'text-blue-800'}`}>{categoryLabels[typedCategory]}</h3>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map((keyword, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className={`cursor-pointer ${isDarkMode ? 'bg-primary/20 text-primary-foreground hover:bg-primary/30' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'}`}
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
                      className={`cursor-pointer ${isDarkMode ? 'bg-primary/20 text-primary-foreground hover:bg-primary/30' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'}`}
                    >
                      Add All Suggestions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Main Content Cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className={`shadow-lg h-full ${isDarkMode ? "border border-border" : "border border-gray-100"}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-foreground">
                  <span className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Upload className="h-4 w-4 text-primary" />
                  </span>
                  Upload Resumes
                  <span className="ml-auto text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-muted">PDF only</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {!canUploadResumes() && (
                  <div className="mb-5 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-start gap-3">
                    <Crown className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">
                        {subscriptionData?.isTrialActive ? "Trial Limit Reached" : "Upgrade Required"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {subscriptionData?.isTrialActive
                          ? "You've used all your trial credits. Upgrade to continue."
                          : "You've reached your resume limit. Upgrade to continue."}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => router.push("/dashboard/subscription")}
                        className="mt-2 h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Upgrade to Premium
                      </Button>
                    </div>
                  </div>
                )}

                {/* Upload area */}
                <div
                  onClick={() => canUploadResumes() && fileInputRef.current?.click()}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-300 group ${
                    canUploadResumes()
                      ? isDragOver
                        ? "border-primary bg-primary/5 scale-[1.02] animate-pulse-ring shadow-lg"
                        : isDarkMode
                          ? "border-border bg-gradient-to-br from-muted/50 to-card hover:border-primary/60 hover:shadow-md"
                          : "border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:border-primary/50 hover:shadow-md"
                      : "border-border bg-muted cursor-not-allowed opacity-50"
                  } ${isUploading ? "pointer-events-none opacity-70" : ""}`}
                >
                  {isUploading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                      <span className="text-sm font-medium text-foreground">Uploading PDF...</span>
                      <span className="text-xs text-muted-foreground mt-0.5">Please wait</span>
                    </div>
                  )}

                  <div className={`mx-auto h-14 w-14 mb-4 rounded-2xl flex items-center justify-center ${
                    isDragOver ? "bg-primary/20" : "bg-primary/10"
                  }`}>
                    <Upload className={`h-7 w-7 animate-float ${
                      isDragOver ? "text-primary" : "text-primary/70"
                    }`} />
                  </div>
                  <p className={`text-base font-semibold ${
                    isDragOver ? "text-primary" : "text-foreground"
                  }`}>
                    {isUploading
                      ? "Processing..."
                      : canUploadResumes()
                        ? isDragOver
                          ? "Drop your files here!"
                          : "Drag & drop or click to upload"
                        : "Upgrade to upload resumes"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {canUploadResumes()
                      ? "PDF files up to 10MB · Multiple files supported"
                      : "Premium feature required"}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    multiple
                    onChange={handleFileUpload}
                    disabled={!canUploadResumes() || isUploading}
                  />
                </div>

                {/* File list with metadata */}
                {currentFiles.length > 0 && (
                  <ul className="mt-4 space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    {currentFiles.map((file, index) => (
                      <li
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-xl transition-colors group/item ${
                          isDarkMode
                            ? "bg-muted/50 hover:bg-muted"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{file.fileName ?? file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(0)}KB · {new Date(file.uploadDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <button
                            onClick={() => handleFileDelete(index)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className={`shadow-lg h-full ${isDarkMode ? "border border-border" : "border border-gray-100"}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-foreground">
                  <span className="h-8 w-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                    <Tag className="h-4 w-4 text-violet-500" />
                  </span>
                  Keywords
                  {Object.values(keywords).flat().length > 0 && (
                    <span className="ml-auto text-xs font-semibold text-violet-500 px-2 py-0.5 rounded-full bg-violet-500/10">
                      {Object.values(keywords).flat().length} added
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-5">
                  {Object.keys(categoryLabels).map((category, catIdx) => {
                    const categoryIcons = {
                      skills: <Zap className="h-4 w-4 text-amber-500" />,
                      experience: <Clock className="h-4 w-4 text-blue-500" />,
                      location: <MapPin className="h-4 w-4 text-rose-500" />,
                      certification: <Award className="h-4 w-4 text-emerald-500" />,
                    }
                    const catKey = category as keyof KeywordCategory
                    return (
                      <div key={category}>
                        {catIdx > 0 && <div className="border-t border-border mb-4" />}
                        <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                          {categoryIcons[catKey]}
                          {categoryLabels[catKey]}
                        </label>
                        {category === "experience" ? (
                          <>
                            <select
                              onChange={handleExperienceSelect}
                              className={`w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                                isDarkMode
                                  ? "border-border bg-input text-foreground"
                                  : "border-gray-200 bg-gray-50 text-gray-800"
                              }`}
                            >
                              <option value="">Select Experience Level</option>
                              <option value="0-1 years">0-1 years</option>
                              <option value="1-3 years">1-3 years</option>
                              <option value="3-5 years">3-5 years</option>
                              <option value="5+ years">5+ years</option>
                            </select>
                            <KeywordDisplay category={catKey} />
                          </>
                        ) : (
                          <>
                            <Input
                              ref={(el) => {
                                keywordInputRefs.current[catKey] = el
                              }}
                              type="text"
                              placeholder={`Type and press Enter to add ${categoryLabels[catKey].toLowerCase()}`}
                              onKeyDown={(e) => handleKeywordInput(catKey, e)}
                              className={`w-full h-10 border rounded-xl text-sm focus:ring-2 focus:ring-primary/40 transition-all ${
                                isDarkMode
                                  ? "border-border bg-input text-foreground"
                                  : "border-gray-200 bg-gray-50 text-gray-800"
                              }`}
                            />
                            <KeywordDisplay category={catKey} />
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── Shimmer Analyze Button ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <button
            onClick={navigateToResults}
            disabled={isLoading}
            className={`btn-shimmer relative w-full overflow-hidden rounded-2xl py-5 text-lg font-bold text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDarkMode
                ? "bg-gradient-to-r text-white from-primary via-primary/80 to-primary/90 "
                : "bg-gradient-to-r text-black from-indigo-600 via-blue-600 to-violet-600  hover:from-indigo-500 hover:via-blue-500 hover:to-violet-500"
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Analyzing Resumes...
                </>
              ) : (
                <>
                  <SparkleIcon className="h-5 w-5" />
                  Analyze Resumes
                  <CheckCircle className="h-5 w-5 opacity-70" />
                </>
              )}
            </span>
          </button>
        </motion.div>


        {/* ── Previous Uploads: Styled Data Card ── */}
        {allFiles.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={`mt-8 rounded-2xl shadow-lg overflow-hidden border ${
              isDarkMode ? "bg-card border-border" : "bg-white border-gray-100"
            }`}
          >
            {/* Section header */}
            <div className={`px-6 py-4 border-b ${
              isDarkMode
                ? "border-border bg-muted/30"
                : "border-gray-100 bg-gray-50"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Previous Uploads</h2>
                    <p className="text-xs text-muted-foreground">{previousFiles.length} resume{previousFiles.length !== 1 ? "s" : ""} stored</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground px-2.5 py-1 rounded-full bg-muted">
                  History
                </span>
              </div>
            </div>

            {/* File rows */}
            {previousFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <FileText className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No previous uploads</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">Your uploaded resumes will appear here</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {previousFiles.map((file: UploadedFile) => (
                  <li
                    key={file.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3.5 transition-colors table-row-stripe ${
                      isDarkMode ? "hover:bg-muted/40" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <a
                          href={`/api/proxy-pdf?url=${encodeURIComponent(file.url || "")}#view=FitH`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-foreground hover:text-primary underline underline-offset-2 decoration-transparent hover:decoration-primary transition-all truncate block"
                        >
                          {file.name}
                        </a>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(file.uploadDate).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                          {" · "}
                          {new Date(file.uploadDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center gap-1.5 flex-shrink-0">
                      {/* Download */}
                      <button
                        onClick={async () => {
                          if (!file.url) return;
                          try {
                            const response = await fetch(`/api/proxy-pdf?url=${encodeURIComponent(file.url)}&download=1&filename=${encodeURIComponent(file.name.endsWith('.pdf') ? file.name : file.name + '.pdf')}`);
                            if (response.ok) {
                              const blob = await response.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = file.name.endsWith('.pdf') ? file.name : file.name + '.pdf';
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              toast.success('Download started!');
                            } else {
                              toast.error('Download failed');
                            }
                          } catch (error) {
                            toast.error('Download failed: ' + String(error));
                          }
                        }}
                        disabled={!file.url}
                        title="Download"
                        className="p-2 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handlePreviousFileDelete(file.id, file.publicId || "")}
                        title="Delete"
                        className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>
        )}

      </div>
    </div>
  )
}
