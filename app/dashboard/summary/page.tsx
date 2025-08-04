"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Crown,
  TrendingUp,
  Target,
  Lightbulb,
  BarChart3,
  Award,
  MapPin,
  Briefcase,
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Toaster } from "react-hot-toast"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/config/firebase"
import { doc, getDoc } from "firebase/firestore"
import { getUserSubscription, type SubscriptionData } from "@/lib/auth"

interface Resume {
  fileName: string
  matches: string[]
  missing: string[]
  score: number
  content: string
  url?: string
  categoryScores?: {
    skills: number
    experience: number
    location: number
    certification: number
  }
}

interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  createdAt: string
  lastLoginAt: string
}

interface ImprovementSuggestion {
  category: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  icon: any
}

export default function SummaryPage() {
  const router = useRouter()
  const [user] = useAuthState(auth)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const storedResume = sessionStorage.getItem("selectedResume")
    if (storedResume) {
      setSelectedResume(JSON.parse(storedResume))
    }

    if (user) {
      loadUserProfile()
      loadSubscriptionData()
    }

    setLoading(false)
  }, [user])

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

  const getUserInitials = () => {
    const name = userProfile?.displayName || user?.displayName || user?.email || "User"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const generateImprovements = (resume: Resume): ImprovementSuggestion[] => {
    const improvements: ImprovementSuggestion[] = []

    // Skills improvements
    if ((resume.categoryScores?.skills || 0) < 70) {
      improvements.push({
        category: "Skills",
        title: "Enhance Technical Skills Section",
        description: "Add more relevant technical skills and certifications to match job requirements better.",
        priority: "high",
        icon: Award,
      })
    }

    // Experience improvements
    if ((resume.categoryScores?.experience || 0) < 70) {
      improvements.push({
        category: "Experience",
        title: "Quantify Your Achievements",
        description: "Add specific metrics and numbers to demonstrate the impact of your work experience.",
        priority: "high",
        icon: TrendingUp,
      })
    }

    // Missing keywords
    if (resume.missing.length > 0) {
      improvements.push({
        category: "Keywords",
        title: "Include Missing Keywords",
        description: `Incorporate ${resume.missing.length} missing keywords: ${resume.missing.slice(0, 3).join(", ")}${resume.missing.length > 3 ? "..." : ""}`,
        priority: "medium",
        icon: Target,
      })
    }

    // Location improvements
    if ((resume.categoryScores?.location || 0) < 50) {
      improvements.push({
        category: "Location",
        title: "Clarify Location Preferences",
        description: "Add clear location information or remote work preferences to match job requirements.",
        priority: "low",
        icon: MapPin,
      })
    }

    // General formatting
    improvements.push({
      category: "Format",
      title: "Improve Resume Structure",
      description: "Use consistent formatting, bullet points, and clear section headers for better readability.",
      priority: "medium",
      icon: FileText,
    })

    return improvements
  }

  const handleViewPDF = () => {
    if (selectedResume) {
      sessionStorage.setItem("selectedResume", JSON.stringify(selectedResume))
      router.push("/dashboard/pdf-viewer")
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 dark:text-green-400"
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getScoreGradient = (score: number) => {
    if (score >= 70) return "bg-gradient-to-r from-green-500 to-emerald-500"
    if (score >= 40) return "bg-gradient-to-r from-yellow-500 to-orange-500"
    return "bg-gradient-to-r from-red-500 to-pink-500"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-12 w-12 border-4 border-[#130F4D] border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading resume summary...</p>
        </div>
      </div>
    )
  }

  if (!selectedResume) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
        <Card className="w-full max-w-md border-2 border-[#130F4D]/10 shadow-lg">
          <CardHeader className="text-center">
            <div className="p-4 bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-800 dark:to-blue-900/20 rounded-full w-16 h-16 mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mt-2" />
            </div>
            <CardTitle className="text-xl">No Resume Selected</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Please select a resume from the results page to view its detailed summary.
            </p>
            <Link href="/dashboard/result">
              <Button className="w-full bg-gradient-to-r from-[#130F4D] to-blue-600 hover:from-[#0F0B3E] hover:to-blue-700 text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Results
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const improvements = generateImprovements(selectedResume)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4 md:p-8 w-full">
      <Toaster />
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header with User Info */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-16 w-16 border-4 border-[#130F4D]/20 shadow-lg">
                  <AvatarImage src={userProfile?.photoURL || user?.photoURL || ""} alt="Profile" />
                  <AvatarFallback className="bg-gradient-to-br from-[#130F4D] to-blue-600 text-white text-lg font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                {subscriptionData?.isActive && (
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1">
                    <Crown className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#130F4D] dark:text-white">Resume Summary</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">Detailed analysis for {selectedResume.fileName}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {Math.round(selectedResume.score)}% Match
                  </Badge>
                  {subscriptionData?.isActive && (
                    <Badge variant="secondary" className="bg-[#130F4D] text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      {subscriptionData.activePlan}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleViewPDF}
                className="bg-gradient-to-r from-[#130F4D] to-blue-600 hover:from-[#0F0B3E] hover:to-blue-700 text-white shadow-md"
              >
                <Eye className="h-4 w-4 mr-2" />
                View PDF
              </Button>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Credits Remaining</p>
                <p className="text-2xl font-bold text-[#130F4D] dark:text-white">
                  {subscriptionData?.resumeLimit || 0}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-2 border-[#130F4D]/10 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#130F4D]/5 to-blue-500/5">
              <CardTitle className="text-xl flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-[#130F4D]" />
                Overall Performance Score
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex items-center justify-center mb-8">
                <div className="relative w-48 h-48">
                  <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - selectedResume.score / 100)}`}
                      className={getScoreColor(selectedResume.score)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(selectedResume.score)}`}>
                        {Math.round(selectedResume.score)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Match Score</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                  <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(selectedResume.categoryScores?.skills || 0)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Skills</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                  <Briefcase className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(selectedResume.categoryScores?.experience || 0)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Experience</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
                  <MapPin className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(selectedResume.categoryScores?.location || 0)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Location</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg">
                  <Award className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                    {Math.round(selectedResume.categoryScores?.certification || 0)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Certifications</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Detailed Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-2 border-[#130F4D]/10 shadow-lg">
            <CardHeader className="pb-2 bg-gradient-to-r from-[#130F4D]/5 to-blue-500/5">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800">
                  <TabsTrigger
                    value="overview"
                    className="data-[state=active]:bg-[#130F4D] data-[state=active]:text-white"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="keywords"
                    className="data-[state=active]:bg-[#130F4D] data-[state=active]:text-white"
                  >
                    <Target className="mr-2 h-4 w-4" />
                    Keywords
                  </TabsTrigger>
                  <TabsTrigger
                    value="improvements"
                    className="data-[state=active]:bg-[#130F4D] data-[state=active]:text-white"
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Improvements
                  </TabsTrigger>
                  <TabsTrigger
                    value="content"
                    className="data-[state=active]:bg-[#130F4D] data-[state=active]:text-white"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Content
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs value={activeTab} className="w-full">
                <TabsContent value="overview" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-[#130F4D] dark:text-white mb-4">
                          Category Breakdown
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Skills Match</span>
                              <span className="text-sm font-bold">
                                {Math.round(selectedResume.categoryScores?.skills || 0)}%
                              </span>
                            </div>
                            <Progress
                              value={selectedResume.categoryScores?.skills || 0}
                              className="h-3"
                              indicatorClassName="bg-gradient-to-r from-blue-500 to-indigo-500"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Experience Match</span>
                              <span className="text-sm font-bold">
                                {Math.round(selectedResume.categoryScores?.experience || 0)}%
                              </span>
                            </div>
                            <Progress
                              value={selectedResume.categoryScores?.experience || 0}
                              className="h-3"
                              indicatorClassName="bg-gradient-to-r from-purple-500 to-pink-500"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Location Match</span>
                              <span className="text-sm font-bold">
                                {Math.round(selectedResume.categoryScores?.location || 0)}%
                              </span>
                            </div>
                            <Progress
                              value={selectedResume.categoryScores?.location || 0}
                              className="h-3"
                              indicatorClassName="bg-gradient-to-r from-orange-500 to-red-500"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Certification Match</span>
                              <span className="text-sm font-bold">
                                {Math.round(selectedResume.categoryScores?.certification || 0)}%
                              </span>
                            </div>
                            <Progress
                              value={selectedResume.categoryScores?.certification || 0}
                              className="h-3"
                              indicatorClassName="bg-gradient-to-r from-teal-500 to-cyan-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-[#130F4D] dark:text-white mb-4">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {selectedResume.matches.length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Matched Keywords</div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg text-center">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                              {selectedResume.missing.length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Missing Keywords</div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {Math.round(
                                (selectedResume.matches.length /
                                  (selectedResume.matches.length + selectedResume.missing.length)) *
                                  100,
                              )}
                              %
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Keyword Coverage</div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg text-center">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {selectedResume.content.split(" ").length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Word Count</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="keywords" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center text-green-700 dark:text-green-400">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Matched Keywords ({selectedResume.matches.length})
                      </h3>
                      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 min-h-[300px]">
                        <div className="flex flex-wrap gap-2">
                          {selectedResume.matches.length > 0 ? (
                            selectedResume.matches.map((keyword, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                              >
                                {keyword}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400 text-sm italic">
                              No matched keywords found
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center text-red-700 dark:text-red-400">
                        <XCircle className="h-5 w-5 mr-2" />
                        Missing Keywords ({selectedResume.missing.length})
                      </h3>
                      <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg border border-red-200 dark:border-red-800 min-h-[300px]">
                        <div className="flex flex-wrap gap-2">
                          {selectedResume.missing.length > 0 ? (
                            selectedResume.missing.map((keyword, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="border-red-200 text-red-800 dark:border-red-900 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                {keyword}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400 text-sm italic">
                              No missing keywords - excellent coverage!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="improvements" className="mt-0">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#130F4D] dark:text-white mb-4 flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2" />
                      Recommended Improvements
                    </h3>
                    {improvements.map((improvement, index) => {
                      const IconComponent = improvement.icon
                      return (
                        <Card
                          key={index}
                          className="border-2 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start space-x-4">
                              <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg">
                                <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-[#130F4D] dark:text-white">{improvement.title}</h4>
                                  <Badge variant="secondary" className={getPriorityColor(improvement.priority)}>
                                    {improvement.priority} priority
                                  </Badge>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                  {improvement.description}
                                </p>
                                <div className="mt-3">
                                  <Badge variant="outline" className="text-xs">
                                    {improvement.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="content" className="mt-0">
                  <div>
                    <h3 className="text-lg font-semibold text-[#130F4D] dark:text-white mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Resume Content
                    </h3>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6 max-h-[600px] overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedResume.content}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex justify-between"
        >
          <Link href="/dashboard/result">
            <Button
              variant="outline"
              className="border-[#130F4D] text-[#130F4D] hover:bg-[#130F4D] hover:text-white bg-transparent"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Results
            </Button>
          </Link>
          <Button
            onClick={handleViewPDF}
            className="bg-gradient-to-r from-[#130F4D] to-blue-600 hover:from-[#0F0B3E] hover:to-blue-700 text-white shadow-md"
          >
            <Eye className="mr-2 h-4 w-4" />
            View Full PDF
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
