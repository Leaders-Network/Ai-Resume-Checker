"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, FileText, Filter, Search, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScoreProgressBar } from "@/components/ui/score-progress-bar"
import { motion } from "framer-motion"
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

export default function ResultPage() {
  const router = useRouter()
  const [user] = useAuthState(auth)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [sortConfig, setSortConfig] = useState({ key: "score", direction: "desc" })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterScore, setFilterScore] = useState("all")

  void userProfile
  void subscriptionData

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

    const storedResumes = sessionStorage.getItem("resumes")
    if (storedResumes) {
      setResumes(JSON.parse(storedResumes))
    }
    if (user) {
      loadUserProfile()
      loadSubscriptionData()
    }
  }, [user])



  // const getUserInitials = () => {
  //   const name = userProfile?.displayName || user?.displayName || user?.email || "User"
  //   return name
  //     .split(" ")
  //     .map((n) => n[0])
  //     .join("")
  //     .toUpperCase()
  //     .slice(0, 2)
  // }

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }))
  }

  const getSortedResumes = () => {
    let filteredResumes = [...resumes]
    // Apply search filter
    if (searchTerm) {
      filteredResumes = filteredResumes.filter(
        (resume) =>
          resume.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resume.matches.some((match) => match.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }
    // Apply score filter
    if (filterScore !== "all") {
      if (filterScore === "high") {
        filteredResumes = filteredResumes.filter((resume) => resume.score >= 70)
      } else if (filterScore === "medium") {
        filteredResumes = filteredResumes.filter((resume) => resume.score >= 40 && resume.score < 70)
      } else if (filterScore === "low") {
        filteredResumes = filteredResumes.filter((resume) => resume.score < 40)
      }
    }
    // Sort
    return filteredResumes.sort((a, b) => {
      if (sortConfig.key === "score") {
        return sortConfig.direction === "asc" ? a.score - b.score : b.score - a.score
      }
      return sortConfig.direction === "asc"
        ? String(a[sortConfig.key as keyof Resume]).localeCompare(String(b[sortConfig.key as keyof Resume]))
        : String(b[sortConfig.key as keyof Resume]).localeCompare(String(a[sortConfig.key as keyof Resume]))
    })
  }

  const fullyMatched = resumes.filter((resume) => resume.score >= 80).length
  const partiallyMatched = resumes.filter((resume) => resume.score >= 40 && resume.score < 80).length
  const barelyMatched = resumes.filter((resume) => resume.score < 40).length

  const handleViewSummary = (resume: Resume) => {
    sessionStorage.setItem("selectedResume", JSON.stringify(resume))
    router.push("/dashboard/summary")
  }

  const handleViewPDF = (resume: Resume) => {
    sessionStorage.setItem("selectedResume", JSON.stringify(resume))
    router.push("/dashboard/pdf-viewer")
  }

  const sortedResumes = getSortedResumes()

  

  return (
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 border-green-200 dark:border-green-700 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-bold text-green-700 dark:text-green-300">{fullyMatched}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-800 dark:text-green-200 font-medium text-lg">Strong Matches</p>
              <p className="text-sm text-green-600/80 dark:text-green-300/80">80-100% match score</p>
              <div className="mt-3 w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((fullyMatched / Math.max(resumes.length, 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/30 dark:to-orange-800/30 border-yellow-200 dark:border-yellow-700 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{partiallyMatched}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-800 dark:text-yellow-200 font-medium text-lg">Partial Matches</p>
              <p className="text-sm text-yellow-600/80 dark:text-yellow-300/80">40-79% match score</p>
              <div className="mt-3 w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((partiallyMatched / Math.max(resumes.length, 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/30 dark:to-pink-800/30 border-red-200 dark:border-red-700 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-bold text-red-700 dark:text-red-300">{barelyMatched}</CardTitle>
            </CardHeader>
            <CardContent>
              <h1 className="text-3xl font-bold text-foreground">Your Results</h1>
              <p className="text-muted-foreground">A summary of your resume analysis.</p>
              <p className="text-sm text-red-600/80 dark:text-red-300/80">0-39% match score</p>
              <div className="mt-3 w-full bg-red-200 dark:bg-red-800 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((barelyMatched / Math.max(resumes.length, 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <Card className="border-2 border-border/10 shadow-lg bg-card">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search by filename or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 border-2 border-input focus:border-primary bg-transparent"
                  />
                </div>
                <div className="w-full md:w-64">
                  <Select value={filterScore} onValueChange={setFilterScore}>
                    <SelectTrigger className="h-12 border-2 border-input focus:border-primary bg-transparent">
                      <div className="flex items-center">
                        <Filter size={18} className="mr-2" />
                        <SelectValue placeholder="Filter by score" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scores</SelectItem>
                      <SelectItem value="high">High (70-100%)</SelectItem>
                      <SelectItem value="medium">Medium (40-69%)</SelectItem>
                      <SelectItem value="low">Low (0-39%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="overflow-hidden border-2 border-border/10 shadow-lg bg-card">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border">
              <CardTitle className="text-xl">Analysis Results</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary/20">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      <div
                        className="flex items-center space-x-2 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort("fileName")}
                      >
                        <span>Filename</span>
                        {sortConfig.key === "fileName" &&
                          (sortConfig.direction === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      <div
                        className="flex items-center space-x-2 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort("score")}
                      >
                        <span>Match Score</span>
                        {sortConfig.key === "score" &&
                          (sortConfig.direction === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Keywords
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResumes.length > 0 ? (
                    sortedResumes.map((resume, index) => (
                      <tr
                        key={index}
                        className="border-t border-border hover:bg-secondary/20 transition-all duration-200"
                      >
                        <td className="px-6 py-4 text-foreground">
                          <div className="flex items-center">
                            <div className="p-2 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg mr-3">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <span className="font-medium text-primary">{resume.fileName}</span>
                              <p className="text-xs text-muted-foreground mt-1">
                                {resume.matches.length} matches • {resume.missing.length} missing
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <ScoreProgressBar score={resume.score} className="h-3 w-24" />
                            <span
                              className={`font-bold text-lg w-12 text-right ${resume.score >= 70
                                ? "text-green-600 dark:text-green-400"
                                : resume.score >= 40
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-red-600 dark:text-red-400"
                                }`}
                            >
                              {Math.round(resume.score)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {resume.matches.slice(0, 3).map((match, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-yellow/20 text-yellow-foreground text-xs"
                              >
                                {match}
                              </Badge>
                            ))}
                            {resume.matches.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{resume.matches.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleViewSummary(resume)}
                              className="bg-yellow text-yellow-foreground hover:bg-yellow/90 shadow-md hover:shadow-lg transition-all"
                              size="sm"
                            >
                              View Analysis
                            </Button>
                            {resume.url && (
                              <Button
                                variant="outline"
                                onClick={() => handleViewPDF(resume)}
                                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                                size="sm"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="p-4 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-full">
                            <FileText className="h-12 w-12 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                              {searchTerm || filterScore !== "all" ? "No matching results" : "No resumes analyzed yet"}
                            </h3>
                            <p className="text-muted-foreground">
                              {searchTerm || filterScore !== "all"
                                ? "Try adjusting your search criteria"
                                : "Upload and analyze resumes to see results here"}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
  )
}
