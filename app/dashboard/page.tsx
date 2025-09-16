"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Upload, Trash2, Loader2, FileText, CheckCircle, Lightbulb, User, Crown } from "lucide-react"
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
import { doc, getDoc, getDocs, setDoc, collection } from "firebase/firestore"
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
          uploadDate: new Date(data.uploadedAt),
          ...data,
        };
      });
      // Ensure each resume has all required UploadedFile fields
      const formattedResumes = resumes.map((resume) => ({
        id: resume.id,
        name: resume.name,
        url: resume.url,
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

            const { url: fileUrl } = await response.json();

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
        {/* Enhanced Header with user info - improved styling */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className={`rounded-xl p-4 sm:p-6 ${isDarkMode
            ? "bg-card shadow-md"
            : "bg-white shadow-md"
            }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex flex-col items-center sm:flex-row sm:items-center sm:space-x-6 space-y-3 sm:space-y-0 w-full">
                <div className="relative mb-2 sm:mb-0">
                  <Avatar className={`h-16 w-16 sm:h-20 sm:w-20 shadow-lg ${isDarkMode
                    ? "border-4 border-primary/20"
                    : "border-4 border-primary/10"
                    }`}>
                    <AvatarImage
                      src={userProfile?.profileImage || userProfile?.photoURL || user?.photoURL || ""}
                      alt="Profile"
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg sm:text-xl font-bold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {(subscriptionData?.isActive || subscriptionData?.isTrialActive) && (
                    <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1">
                      <Crown className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="text-center sm:text-left w-full">
                  <h1 className={`text-2xl sm:text-4xl font-bold ${isDarkMode
                    ? "text-primary"
                    : "text-gray-800"
                    }`}>
                    Welcome back, {userProfile?.displayName || user?.displayName || "User"}!
                  </h1>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-blue-700'} mb-2 sm:mb-4 text-base sm:text-lg`}>Ready to analyze some resumes today?</p>
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-2 sm:mt-3">
                    <Badge
                      variant="secondary"
                      className={`${isDarkMode
                        ? "bg-secondary/50 text-secondary-foreground"
                        : "bg-blue-50 text-blue-700"
                        }`}
                    >
                      <User className="h-3 w-3 mr-1" />
                      {subscriptionData?.isTrialActive ? "Free Trial" : subscriptionData?.activePlan || "Free"}
                    </Badge>
                    {subscriptionData?.isTrialActive && (
                      <Badge
                        variant="secondary"
                        className={`${isDarkMode
                          ? "bg-primary/20 text-primary"
                          : "bg-amber-50 text-amber-700"
                          }`}
                      >
                        {getRemainingDays()} days left
                      </Badge>
                    )}
                    {(subscriptionData?.isActive || subscriptionData?.isTrialActive) && (
                      <Badge variant="secondary" className="bg-primary text-primary-foreground">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium Features
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats Cards */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className={`shadow-lg hover:shadow-xl transition-shadow ${isDarkMode
              ? "bg-card border-border"
              : "bg-white border-gray-200"
              }`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-3xl font-bold ${isDarkMode
                  ? "text-primary"
                  : "text-primary"
                  }`}>
                  {subscriptionData?.resumeLimit === 999999 ? "∞" : subscriptionData?.resumeLimit || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`font-medium text-lg ${isDarkMode
                  ? "text-card-foreground"
                  : "text-gray-800"
                  }`}>Resume Credits</p>
                <p className="text-sm text-muted-foreground">Remaining analyses</p>
                <div className="mt-3 w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(((subscriptionData?.resumeLimit || 0) / 100) * 100, 100)}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card className={`shadow-lg hover:shadow-xl transition-shadow ${isDarkMode
              ? "bg-card border-border"
              : "bg-white border-gray-200"
              }`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-3xl font-bold ${isDarkMode
                  ? "text-primary"
                  : "text-primary"
                  }`}>
                  {currentFiles.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`font-medium text-lg ${isDarkMode
                  ? "text-card-foreground"
                  : "text-gray-800"
                  }`}>Uploaded Resumes</p>
                <p className="text-sm text-muted-foreground">Ready for analysis</p>
                <div className="mt-3 flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {currentFiles.length > 0 ? "Files ready" : "No files uploaded"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className={`shadow-lg hover:shadow-xl transition-shadow ${isDarkMode
              ? "bg-card border-border"
              : "bg-white border-gray-200"
              }`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-3xl font-bold ${isDarkMode
                  ? "text-primary"
                  : "text-primary"
                  }`}>
                  {Object.values(keywords).flat().length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`font-medium text-lg ${isDarkMode
                  ? "text-card-foreground"
                  : "text-gray-800"
                  }`}>Keywords</p>
                <p className="text-sm text-muted-foreground">Added for matching</p>
                <div className="mt-3 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
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

        {/* Main content cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 ">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}

          >
            <Card className={`shadow-lg ${isDarkMode
              ? "border-2 border-border"
              : "border border-gray-200"
              }`}>
              <CardHeader className={`pb-2 ${isDarkMode
                ? "bg-card"
                : "bg-white"
                }`}>
                <CardTitle className={`flex items-center text-xl ${isDarkMode
                  ? "text-card-foreground"
                  : "text-gray-800"
                  }`}>
                  <Upload className="mr-2 h-6 w-6 text-primary" />
                  Upload Resumes
                </CardTitle>
              </CardHeader>
              <CardContent className={`pt-6 ${isDarkMode
                ? ""
                : "bg-white"
                }`}>
                {!canUploadResumes() && (
                  <div className="mb-6 p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                    <div className="flex items-center space-x-3 mb-3">
                      <Crown className="h-6 w-6 text-primary" />
                      <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-blue-800'}`}>ground
                        {subscriptionData?.isTrialActive ? "Trial Limit Reached" : "Upgrade Required"}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {subscriptionData?.isTrialActive
                        ? "You've used all your trial credits. Upgrade to continue analyzing resumes."
                        : "You've reached your resume limit. Upgrade to continue analyzing resumes."}
                    </p>
                    <Button
                      onClick={() => router.push("/dashboard/subscription")}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Upgrade to Premium
                    </Button>

                    {/* Uploaded files ready for analysis */}
{currentFiles.length > 0 && (
  <section className={`mt-6 rounded-xl shadow p-4 ${isDarkMode ? "bg-card border border-border" : "bg-white border border-gray-200"}`}>
    <h2 className={`text-lg font-semibold mb-3 ${isDarkMode ? "text-primary" : "text-gray-800"}`}>Ready for Analysis</h2>
    <ul className="divide-y divide-gray-200 dark:divide-border">
      {currentFiles.map((file, index) => (
        <li key={file.id ?? index} className="flex flex-col sm:flex-row sm:items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <FileText className={`h-5 w-5 ${isDarkMode ? "text-primary" : "text-blue-600"}`} />
            <span className={`font-medium ${isDarkMode ? "text-primary" : "text-blue-700"}`}>{file.fileName ?? file.name}</span>
            <span className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {new Date(file.uploadDate).toLocaleString()}
            </span>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-2">
            <button
              onClick={() => handleFileDelete(index)}
              className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${isDarkMode
                  ? "bg-primary/20 text-primary-foreground hover:bg-primary/40"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  </section>
)}
                  </div>
                )}

                {/* Upload area */}
                <div
                  onClick={() => canUploadResumes() && fileInputRef.current?.click()}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`relative border-4 border-dashed rounded-xl p-4 sm:p-8 cursor-pointer transition-all duration-300 ${canUploadResumes()
                    ? isDragOver
                      ? "border-primary/80 bg-primary/5 scale-105 shadow-lg"
                      : isDarkMode
                        ? "border-border bg-card hover:border-primary/50 hover:shadow-lg"
                        : "border-gray-300 bg-white hover:border-primary/50 hover:shadow-lg"
                    : isDarkMode
                      ? "border-border bg-muted cursor-not-allowed opacity-50"
                      : "border-gray-300 bg-gray-50 cursor-not-allowed opacity-50"
                    } ${isUploading ? "pointer-events-none opacity-70" : ""}`}
                >
                  {isUploading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80">
                      <div className="flex items-center space-x-3">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-sm font-medium">Uploading PDF...</span>
                      </div>
                    </div>
                  )}
                  <Upload
                    className={`mx-auto h-16 w-16 mb-4 ${canUploadResumes()
                      ? isDragOver
                        ? "text-primary"
                        : "text-gray-400 dark:text-gray-500"
                      : "text-gray-400 dark:text-gray-500"
                      }`}
                  />
                  <p
                    className={`text-center text-lg font-medium ${canUploadResumes()
                      ? isDragOver
                        ? "text-primary"
                        : "text-gray-700 dark:text-gray-300"
                      : "text-gray-500 dark:text-gray-500"
                      }`}
                  >
                    {isUploading
                      ? "Uploading..."
                      : canUploadResumes()
                        ? isDragOver
                          ? "Drop PDF files here!"
                          : "Drag & drop PDF files or click to upload"
                        : "Upgrade to upload resumes"}
                  </p>
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
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
                    disabled={!canUploadResumes() || isUploading}
                  />
                </div>

                {/* File list */}
                <ul className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {currentFiles.map((file, index) => (
                    <li
                      key={index}
                      className={`flex flex-col xs:flex-row items-start xs:items-center justify-between p-3 sm:p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow gap-2 sm:gap-0 ${isDarkMode
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary text-primary-foreground"
                        }`}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <FileText className="h-5 w-5 mr-3 text-primary-foreground flex-shrink-0" />
                        <span className="text-primary-foreground truncate font-medium">{file.fileName ?? file.name}</span>
                      </div>
                      <button
                        onClick={() => handleFileDelete(index)}
                        className="text-primary-foreground/70 hover:text-primary-foreground ml-3 p-1 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>



          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className={`shadow-lg h-full ${isDarkMode
              ? "border-2 border-border"
              : "border border-gray-200"
              }`}>
              <CardHeader className={`pb-2 ${isDarkMode
                ? "bg-card"
                : "bg-white"
                }`}>
                <CardTitle className={`flex items-center text-xl ${isDarkMode
                  ? "text-card-foreground"
                  : "text-gray-800"
                  }`}>
                  <CheckCircle className="mr-2 h-6 w-6 text-primary" />
                  Keywords
                </CardTitle>
              </CardHeader>
              <CardContent className={`pt-6 ${isDarkMode
                ? ""
                : "bg-white"
                }`}>
                <div className="space-y-6">
                  {Object.keys(categoryLabels).map((category) => (
                    <div key={category} className="space-y-3">
                      <label className={`block text-lg font-semibold ${isDarkMode
                        ? "text-foreground"
                        : "text-gray-800"
                        }`}>
                        {categoryLabels[category as keyof KeywordCategory]}
                      </label>
                      {category === "experience" ? (
                        <>
                          <select
                            onChange={handleExperienceSelect}
                            className={`w-full border-2 rounded-lg p-3 focus:border-primary transition-colors ${isDarkMode
                              ? "border-border bg-input text-foreground"
                              : "border-gray-300 bg-gray-50 text-gray-800 focus:border-primary"
                              }`}
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
                              ref={(el) => {
                                keywordInputRefs.current[category as keyof KeywordCategory] = el
                              }}
                              type="text"
                              placeholder={`Enter ${categoryLabels[category as keyof KeywordCategory]} and press Enter`}
                              onKeyDown={(e) => handleKeywordInput(category as keyof KeywordCategory, e)}
                              className={`w-full h-12 border-2 focus:border-primary transition-colors ${isDarkMode
                                ? "border-border bg-input text-foreground"
                                : "border-gray-300 bg-gray-50 text-gray-800 focus:border-primary"
                                }`}
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

        {/* Submit button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <Button
            onClick={navigateToResults}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 sm:py-4 rounded-xl text-lg sm:text-xl font-bold h-14 sm:h-16 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-3 inline-block h-6 w-6" />
                Processing Resumes...
              </>
            ) : (
              <>
                <CheckCircle className="mr-3 inline-block h-6 w-6" />
                Analyze Resumes
              </>
            )}
          </Button>
        </motion.div>


        {/* previous uploads  */}
      
{allFiles.length > 0 && (
    <section className={`mt-8 rounded-xl shadow-lg p-4 sm:p-6 ${isDarkMode ? "bg-card border border-border" : "bg-white border border-gray-200"}`}>
    <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-primary" : "text-gray-800"}`}>Previous Uploads</h2>
    <ul className="divide-y divide-gray-200 dark:divide-border">
      {previousFiles.map((file: UploadedFile) => (
        <li key={file.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <FileText className={`h-5 w-5 ${isDarkMode ? "text-primary" : "text-blue-600"}`} />
            <a
              href={`/api/proxy-pdf?url=${encodeURIComponent(file.url || "")}#view=FitH`}
              target="_blank"
              rel="noopener noreferrer"
              className={`font-medium underline ${isDarkMode ? "text-primary" : "text-blue-700"} hover:text-blue-500`}
            >
              {file.name}
            </a>
            <span className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {new Date(file.uploadDate).toLocaleString()}
            </span>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-2">
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
              className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors
${isDarkMode
                ? "bg-primary/20 text-primary-foreground hover:bg-primary/40"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}
              disabled={!file.url}
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
              </svg>
              Download
            </button>
          </div>
        </li>
      ))}
    </ul>
  </section>
)}


      </div>
    </div>
  )
}
