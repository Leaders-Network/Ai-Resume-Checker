"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScoreProgressBar } from "@/components/ui/score-progress-bar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Download, FileText, CheckCircle, XCircle, BarChart, Eye, Crown, TrendingUp } from "lucide-react"
import {  pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
// Set workerSrc for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
import { motion } from "framer-motion"
import Link from "next/link"
import { toast, Toaster } from "react-hot-toast"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/config/firebase"
import { doc, getDoc } from "firebase/firestore"
import { getUserSubscription, type SubscriptionData } from "@/lib/auth"
import ResumeContentCard from "@/components/ResumeContentCard"


interface Resume {
  fileName: string
  matches: string[]
  missing: string[]
  score: number
  content: string
  pdfUrl?: string | Blob // Allow both string and Blob types
  categoryScores?: {
    skills: number
    experience: number
    location: number
    certification: number
  }
}

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
  createdAt: string
  lastLoginAt: string
}

export default function CompareResumesPage() {
  const router = useRouter()
  const [user] = useAuthState(auth)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumes, setSelectedResumes] = useState<Resume[]>([])
  const [keywords, setKeywords] = useState<KeywordCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("metrics")


    // Save the comparison selection to session storage when it changes
    useEffect(() => {
      if (selectedResumes.length > 0) {
        const fileNames = selectedResumes.map((resume) => resume.fileName)
        sessionStorage.setItem("compareList", JSON.stringify(fileNames))
      }
    }, [selectedResumes])


  useEffect(() => {
    const storedResumes = sessionStorage.getItem("resumes")
    const storedKeywords = sessionStorage.getItem("keywordCategories")
    const storedCompareList = sessionStorage.getItem("compareList")

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

    if (storedResumes) {
      const parsedResumes = JSON.parse(storedResumes)
      setResumes(parsedResumes)
      // If we have a stored compare list, use it
      if (storedCompareList) {
        const compareIds = JSON.parse(storedCompareList)
        const resumesToCompare = parsedResumes.filter((resume: Resume) => compareIds.includes(resume.fileName))
        setSelectedResumes(resumesToCompare)
      } else if (parsedResumes.length > 0) {
        // Default to the top 2 scoring resumes if no stored selection
        const sortedResumes = [...parsedResumes].sort((a, b) => b.score - a.score)
        setSelectedResumes(sortedResumes.slice(0, Math.min(2, sortedResumes.length)))
      }
    }

    if (storedKeywords) {
      setKeywords(JSON.parse(storedKeywords))
    }

    if (user) {
      loadUserProfile()
      loadSubscriptionData()
    }

    setLoading(false)
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

  const handleToggleResume = (resume: Resume) => {
    if (selectedResumes.some((r) => r.fileName === resume.fileName)) {
      setSelectedResumes(selectedResumes.filter((r) => r.fileName !== resume.fileName))
    } else {
      if (selectedResumes.length >= 3) {
        toast.error("You can compare up to 3 resumes at a time")
        return
      }
      setSelectedResumes([...selectedResumes, resume])
    }
  }

    const handleExportComparison = () => {
    toast.success("Exporting comparison as PDF...", {
      duration: 2000,
    })
    // In a real implementation, you would generate a PDF here
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-12 w-12 border-4 border-[#130F4D] border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading resumes...</p>
        </div>
      </div>
    )
  }

  if (resumes.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
        <Card className="w-full max-w-md border-2 border-[#130F4D]/10 shadow-lg">
          <CardHeader className="text-center">
            <div className="p-4 bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-800 dark:to-blue-900/20 rounded-full w-16 h-16 mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mt-2" />
            </div>
            <CardTitle className="text-xl">No Resumes Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-gray-600 dark:text-gray-400">You need to analyze resumes before you can compare them.</p>
            <Link href="/dashboard">
              <Button className="w-full bg-orange-600 text-white  ">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-6 w-full">
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
                <h1 className="text-3xl font-bold text-[#130F4D] dark:text-white">Resume Comparison</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Compare up to 3 resumes side by side to find the best candidate
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    <BarChart className="h-3 w-3 mr-1" />
                    {selectedResumes.length} Selected
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
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Credits Remaining</p>
                <p className="text-2xl font-bold text-[#130F4D] dark:text-white">
                  {subscriptionData?.resumeLimit || 0}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

  <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Enhanced Resume Selection Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="border-2 border-[#130F4D]/10 shadow-lg">
              <CardHeader className="pb-2 bg-gradient-to-r from-[#130F4D]/5 to-blue-500/5">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-[#130F4D]" />
                  Select Resumes
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">Choose up to 3 resumes to compare</p>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  {resumes.map((resume, index) => (
                    <label
                      key={index}
                      htmlFor={`resume-${index}`}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 flex items-start space-x-3 ${selectedResumes.some((r) => r.fileName === resume.fileName)
                        ? "border-primary bg-primary/10 shadow-lg"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                    >
                      <Checkbox
                        checked={selectedResumes.some((r) => r.fileName === resume.fileName)}
                        onCheckedChange={() => handleToggleResume(resume)}
                        id={`resume-${index}`}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate mb-2">{resume.fileName}</div>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <ScoreProgressBar score={resume.score} className="h-1.5" />
                          </div>
                          <span className="text-sm font-bold text-foreground min-w-[3rem]">
                            {Math.round(resume.score)}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{resume.matches.length} matches</span>
                          <span>•</span>
                          <span>{resume.missing.length} missing</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-6 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/dashboard/result")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Results
                  </Button>
                  <Button
                    className="w-full"
                    disabled={selectedResumes.length === 0}
                    onClick={handleExportComparison}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Comparison
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Comparison Area */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <Card className="border-2 border-[#130F4D]/10 shadow-lg">
              <CardHeader className="pb-2 bg-gradient-to-r from-[#130F4D]/5 to-blue-500/5">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-800">
                    <TabsTrigger
                      value="metrics"
                      className="data-[state=active]:bg-[#130F4D] data-[state=active]:text-white"
                    >
                      <BarChart className="mr-2 h-4 w-4" />
                      Metrics
                    </TabsTrigger>
                    <TabsTrigger
                      value={keywords ? "keywords" : "metrics"}
                      className="data-[state=active]:bg-[#130F4D] data-[state=active]:text-white"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Keywords
                    </TabsTrigger>
                    <TabsTrigger
                      value="content"
                      className="data-[state=active]:bg-[#130F4D] data-[state=active]:text-white"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Content
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="pt-6">
                {selectedResumes.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="p-6 bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-800 dark:to-blue-900/20 rounded-full w-24 h-24 mx-auto mb-6">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mt-3" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-3">No Resumes Selected</h3>
                    <p className="text-gray-500 dark:text-gray-500 max-w-md mx-auto">
                      Select at least one resume from the panel to start comparing their performance and characteristics
                    </p>
                  </div>
                ) : (
                  <Tabs value={activeTab} className="w-full">
                    <TabsContent value="metrics" className="mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Overall Score */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg text-[#130F4D] dark:text-white flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2" />
                            Overall Score
                          </h3>
                          {selectedResumes.map((resume, index) => (
                            <div
                              key={index}
                              className="space-y-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-lg"
                            >
                              <div className="flex justify-between items-center">
                                <span
                                  className="truncate max-w-[140px] font-medium text-[#130F4D] dark:text-white"
                                  title={resume.fileName}
                                >
                                  {resume.fileName}
                                </span>
                                <span className="font-bold text-lg text-[#130F4D] dark:text-white">
                                  {Math.round(resume.score)}%
                                </span>
                              </div>
                              <ScoreProgressBar score={resume.score} />
                            </div>
                          ))}
                        </div>

                        {/* Skills Score */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg text-[#130F4D] dark:text-white">Skills Match</h3>
                          {selectedResumes.map((resume, index) => (
                            <div
                              key={index}
                              className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg"
                            >
                              <div className="flex justify-between items-center">
                                <span
                                  className="truncate max-w-[140px] font-medium text-[#130F4D] dark:text-white"
                                  title={resume.fileName}
                                >
                                  {resume.fileName}
                                </span>
                                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                                  {Math.round(resume.categoryScores?.skills || 0)}%
                                </span>
                              </div>
                              <ScoreProgressBar score={resume.categoryScores?.skills || 0} />
                            </div>
                          ))}
                        </div>

                        {/* Experience Score */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg text-[#130F4D] dark:text-white">Experience Match</h3>
                          {selectedResumes.map((resume, index) => (
                            <div
                              key={index}
                              className="space-y-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg"
                            >
                              <div className="flex justify-between items-center">
                                <span
                                  className="truncate max-w-[140px] font-medium text-[#130F4D] dark:text-white"
                                  title={resume.fileName}
                                >
                                  {resume.fileName}
                                </span>
                                <span className="font-bold text-lg text-purple-600 dark:text-purple-400">
                                  {Math.round(resume.categoryScores?.experience || 0)}%
                                </span>
                              </div>
                              <ScoreProgressBar score={resume.categoryScores?.experience || 0} />
                            </div>
                          ))}
                        </div>

                        {/* Location Score */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg text-[#130F4D] dark:text-white">Location Match</h3>
                          {selectedResumes.map((resume, index) => (
                            <div
                              key={index}
                              className="space-y-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg"
                            >
                              <div className="flex justify-between items-center">
                                <span
                                  className="truncate max-w-[140px] font-medium text-[#130F4D] dark:text-white"
                                  title={resume.fileName}
                                >
                                  {resume.fileName}
                                </span>
                                <span className="font-bold text-lg text-orange-600 dark:text-orange-400">
                                  {Math.round(resume.categoryScores?.location || 0)}%
                                </span>
                              </div>
                              <ScoreProgressBar score={resume.categoryScores?.location || 0} />
                            </div>
                          ))}
                        </div>

                        {/* Certification Score */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg text-[#130F4D] dark:text-white">Certification Match</h3>
                          {selectedResumes.map((resume, index) => (
                            <div
                              key={index}
                              className="space-y-3 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg"
                            >
                              <div className="flex justify-between items-center">
                                <span
                                  className="truncate max-w-[140px] font-medium text-[#130F4D] dark:text-white"
                                  title={resume.fileName}
                                >
                                  {resume.fileName}
                                </span>
                                <span className="font-bold text-lg text-teal-600 dark:text-teal-400">
                                  {Math.round(resume.categoryScores?.certification || 0)}%
                                </span>
                              </div>
                              <ScoreProgressBar score={resume.categoryScores?.certification || 0} />
                            </div>
                          ))}
                        </div>

                        {/* Keyword Count */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg text-[#130F4D] dark:text-white">Keyword Count</h3>
                          {selectedResumes.map((resume, index) => (
                            <div
                              key={index}
                              className="space-y-3 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg"
                            >
                              <div className="flex justify-between items-center">
                                <span
                                  className="truncate max-w-[140px] font-medium text-[#130F4D] dark:text-white"
                                  title={resume.fileName}
                                >
                                  {resume.fileName}
                                </span>
                                <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                                  {resume.matches.length} / {resume.matches.length + resume.missing.length}
                                </span>
                              </div>
                              <ScoreProgressBar
                                score={
                                  (resume.matches.length /
                                    (resume.matches.length + resume.missing.length)) *
                                  100
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="keywords" className="mt-0">
                      <div className="grid grid-cols-1 gap-6">
                        {selectedResumes.map((resume, index) => (
                          <Card
                            key={index}
                            className="overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-md"
                          >
                            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 py-4">
                              <CardTitle className="text-lg truncate text-[#130F4D] dark:text-white">
                                {resume.fileName}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h3 className="font-semibold text-base mb-3 flex items-center text-green-700 dark:text-green-400">
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    Matched Keywords ({resume.matches.length})
                                  </h3>
                                  <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg min-h-[120px] border border-green-200 dark:border-green-800">
                                    {resume.matches.length > 0 ? (
                                      resume.matches.map((keyword, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="secondary"
                                          className="bg-yellow/20 text-yellow-foreground"
                                        >
                                          {keyword}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-gray-500 dark:text-gray-400 text-sm italic">
                                        No matched keywords
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-base mb-3 flex items-center text-destructive">
                                    <XCircle className="h-5 w-5 mr-2" />
                                    Missing Keywords ({resume.missing.length})
                                  </h3>
                                  <div className="flex flex-wrap gap-2 p-4 bg-destructive/10 rounded-lg min-h-[120px] border border-destructive/20">
                                    {resume.missing.length > 0 ? (
                                      resume.missing.map((keyword, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className="border-destructive/30 text-destructive"
                                        >
                                          {keyword}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-gray-500 dark:text-gray-400 text-sm italic">
                                        No missing keywords
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="content" className="mt-0">
                   <div className="grid grid-cols-1 gap-6">
  {selectedResumes.map((resume, index) => (
    <ResumeContentCard key={index} resume={resume} />
  ))}
</div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
