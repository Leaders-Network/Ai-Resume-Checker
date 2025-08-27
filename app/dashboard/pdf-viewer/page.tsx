"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  Crown,
  Eye,
  Maximize,
  Minimize,
  RefreshCw,
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { toast, Toaster } from "react-hot-toast"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/config/firebase"
import { doc, getDoc } from "firebase/firestore"
import { getUserSubscription, checkFeatureAccess, type SubscriptionData } from "@/lib/auth"
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist"
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api"

// PDF.js worker setup
GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs"

interface Resume {
  fileName: string
  matches: string[]
  missing: string[]
  score: number
  content: string
  url?: string
  blob?: Blob
  file?: File
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
  profileImage?: string
  createdAt: string
  lastLoginAt: string
}

export default function PDFViewerPage() {
  const router = useRouter()
  const [user] = useAuthState(auth)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null)



  useEffect(() => {
    // Load resumes from session storage
    const storedResumes = sessionStorage.getItem("resumes")

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

      // Check if there's a selected resume from session storage
      const storedSelectedResume = sessionStorage.getItem("selectedResume")
      if (storedSelectedResume) {
        const selectedResumeData = JSON.parse(storedSelectedResume)
        const foundResume = parsedResumes.find((r: Resume) => r.fileName === selectedResumeData.fileName)
        if (foundResume) {
          setSelectedResume(foundResume)
        }
      } else if (parsedResumes.length > 0) {
        setSelectedResume(parsedResumes[0])
      }
    }

    if (user) {
      loadUserProfile()
      loadSubscriptionData()
    }

    setLoading(false)
  }, [user])

  const renderPage = useCallback(async (pageNumber: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return

    try {
      const page = await pdfDocRef.current.getPage(pageNumber)
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")
      if (!context) {
        return
      }

      const viewport = page.getViewport({ scale: zoom, rotation })
      canvas.height = viewport.height
      canvas.width = viewport.width

      const renderContext = {
        canvasContext: context as CanvasRenderingContext2D,
        viewport: viewport,
      }

      await page.render(renderContext).promise
    } catch (error) {
      console.error("Error rendering page:", error)
      toast.error("Failed to render page")
    }
  }, [zoom, rotation])

  const loadPDF = useCallback(async () => {
    if (!selectedResume || !canvasRef.current) return

    // Check if user has access to PDF viewer
    if (!checkFeatureAccess(subscriptionData, "basic")) {
      toast.error("🔒 Upgrade to access PDF viewer!")
      return
    }

    setPdfLoading(true)
    try {
      let pdfData: ArrayBuffer

      if (selectedResume.blob) {
        pdfData = await selectedResume.blob.arrayBuffer()
      } else if (selectedResume.file) {
        pdfData = await selectedResume.file.arrayBuffer()
      } else if (selectedResume.url) {
        const response = await fetch(selectedResume.url)
        pdfData = await response.arrayBuffer()
      } else {
        throw new Error("No PDF data available")
      }

      const pdf = await getDocument(new Uint8Array(pdfData)).promise
      pdfDocRef.current = pdf
      setTotalPages(pdf.numPages)
      setCurrentPage(1)
      await renderPage(1)
    } catch (error) {
      console.error("Error loading PDF:", error)
      toast.error("Failed to load PDF")
    } finally {
      setPdfLoading(false)
    }
  }, [selectedResume, subscriptionData, renderPage])

  useEffect(() => {

    if (selectedResume) {
      loadPDF()
    }
  }, [selectedResume, loadPDF])



  const getUserInitials = () => {
    const name = userProfile?.displayName || user?.displayName || user?.email || "User"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }



  const handleZoomIn = () => {
    if (!checkFeatureAccess(subscriptionData, "basic")) {
      toast.error("🔒 Upgrade to access zoom controls!")
      return
    }
    const newZoom = Math.min(zoom + 0.25, 3)
    setZoom(newZoom)
    renderPage(currentPage)
  }

  const handleZoomOut = () => {
    if (!checkFeatureAccess(subscriptionData, "basic")) {
      toast.error("🔒 Upgrade to access zoom controls!")
      return
    }
    const newZoom = Math.max(zoom - 0.25, 0.5)
    setZoom(newZoom)
    renderPage(currentPage)
  }

  const handleRotate = () => {
    if (!checkFeatureAccess(subscriptionData, "advanced")) {
      toast.error("🔒 Upgrade to access rotation controls!")
      return
    }
    const newRotation = (rotation + 90) % 360
    setRotation(newRotation)
    renderPage(currentPage)
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      renderPage(page)
    }
  }

  const handleResumeChange = (fileName: string) => {
    const resume = resumes.find((r) => r.fileName === fileName)
    if (resume) {
      setSelectedResume(resume)
      sessionStorage.setItem("selectedResume", JSON.stringify(resume))
    }
  }

  const handleDownload = () => {
    if (!checkFeatureAccess(subscriptionData, "basic")) {
      toast.error("🔒 Upgrade to access download feature!")
      return
    }

    if (!selectedResume) return

    try {
      let blob: Blob
      if (selectedResume.blob) {
        blob = selectedResume.blob
      } else if (selectedResume.file) {
        blob = new Blob([selectedResume.file], { type: "application/pdf" })
      } else {
        toast.error("No downloadable file available")
        return
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = selectedResume.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Download started!")
    } catch (error) {
      console.error("Error downloading file:", error)
      toast.error("Failed to download file")
    }
  }

  const toggleFullscreen = () => {
    if (!checkFeatureAccess(subscriptionData, "advanced")) {
      toast.error("🔒 Upgrade to access fullscreen mode!")
      return
    }

    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const resetView = () => {
    setZoom(1)
    setRotation(0)
    setCurrentPage(1)
    renderPage(1)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-12 w-12 border-4 border-[#130F4D] border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading PDF viewer...</p>
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
            <CardTitle className="text-xl">No Resumes Available</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-gray-600 dark:text-gray-400">Upload and analyze resumes to view them here.</p>
            <Link href="/dashboard">
              <Button className="w-full bg-gradient-to-r from-[#130F4D] to-blue-600 hover:from-[#0F0B3E] hover:to-blue-700 text-white">
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
                <h1 className="text-3xl font-bold text-[#130F4D] dark:text-white">PDF Viewer</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {selectedResume ? `Viewing: ${selectedResume.fileName}` : "Select a resume to view"}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    PDF Viewer
                  </Badge>
                  {(subscriptionData?.isActive || subscriptionData?.isTrialActive) && (
                    <Badge variant="secondary" className="bg-[#130F4D] text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      {subscriptionData?.isTrialActive ? "Trial" : subscriptionData.activePlan}
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

        {/* Access Restriction Warning */}
        {!checkFeatureAccess(subscriptionData, "basic") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Card className="border-2 border-red-300 dark:border-red-600 shadow-lg">
              <CardHeader className="pb-2 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30">
                <CardTitle className="flex items-center text-red-800 dark:text-red-300">
                  <Crown className="mr-2 h-5 w-5" />
                  Upgrade Required
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-red-700 dark:text-red-400 mb-4">
                  PDF viewer is a premium feature. Upgrade your plan to view and interact with PDF documents.
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Enhanced Control Panel */}
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
                  Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Resume Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Select Resume
                  </label>
                  <Select value={selectedResume?.fileName || ""} onValueChange={handleResumeChange}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-[#130F4D] dark:border-gray-600">
                      <SelectValue placeholder="Choose a resume" />
                    </SelectTrigger>
                    <SelectContent>
                      {resumes.map((resume) => (
                        <SelectItem key={resume.fileName} value={resume.fileName}>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span className="truncate max-w-[200px]">{resume.fileName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Page Navigation */}
                {totalPages > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Page Navigation
                    </label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="flex-1"
                      >
                        Previous
                      </Button>
                      <span className="text-sm font-medium px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="flex-1"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}

                {/* Zoom Controls */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Zoom Level: {Math.round(zoom * 100)}%
                  </label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomOut}
                      disabled={zoom <= 0.5 || !checkFeatureAccess(subscriptionData, "basic")}
                      className="flex-1 bg-transparent"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomIn}
                      disabled={zoom >= 3 || !checkFeatureAccess(subscriptionData, "basic")}
                      className="flex-1"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* View Controls */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full border-[#130F4D] text-[#130F4D] hover:bg-[#130F4D] hover:text-white bg-transparent"
                    onClick={handleRotate}
                    disabled={!checkFeatureAccess(subscriptionData, "advanced")}
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    Rotate {!checkFeatureAccess(subscriptionData, "advanced") && "🔒"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 bg-transparent"
                    onClick={resetView}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset View
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 bg-transparent"
                    onClick={toggleFullscreen}
                    disabled={!checkFeatureAccess(subscriptionData, "advanced")}
                  >
                    {isFullscreen ? (
                      <>
                        <Minimize className="mr-2 h-4 w-4" />
                        Exit Fullscreen
                      </>
                    ) : (
                      <>
                        <Maximize className="mr-2 h-4 w-4" />
                        Fullscreen {!checkFeatureAccess(subscriptionData, "advanced") && "🔒"}
                      </>
                    )}
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t ">
                  <Button
                    className="w-full bg-gradient-to-r from-[#130F4D] to-blue-600 hover:from-[#0F0B3E] hover:to-blue-700 text-white shadow-md"
                    onClick={handleDownload}
                    disabled={!selectedResume || !checkFeatureAccess(subscriptionData, "basic")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF {!checkFeatureAccess(subscriptionData, "basic") && "🔒"}
                  </Button>
                  <Link href="/dashboard/result">
                    <Button
                      variant="outline"
                      className="w-full border-[#130F4D] text-[#130F4D] hover:bg-[#130F4D] hover:text-white bg-transparent mt-4"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4 " />
                      Back to Results
                    </Button>
                  </Link>
                </div>

                {/* Resume Info */}
                {selectedResume && (
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Resume Info</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Score:</span>
                        <Badge
                          variant="secondary"
                          className={
                            selectedResume.score >= 70
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : selectedResume.score >= 40
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          }
                        >
                          {Math.round(selectedResume.score)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Matches:</span>
                        <span className="font-medium">{selectedResume.matches.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Missing:</span>
                        <span className="font-medium">{selectedResume.missing.length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced PDF Viewer */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <Card className="border-2 border-[#130F4D]/10 shadow-lg">
              <CardHeader className="pb-2 bg-gradient-to-r from-[#130F4D]/5 to-blue-500/5">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="mr-2 h-5 w-5 text-[#130F4D]" />
                    PDF Document
                  </div>
                  {totalPages > 0 && (
                    <div className="text-sm font-normal text-gray-600 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div
                  ref={containerRef}
                  className="relative bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-auto"
                  style={{ height: "70vh" }}
                >
                  {!checkFeatureAccess(subscriptionData, "basic") ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="p-6 bg-gradient-to-br from-gray-100 to-red-100 dark:from-gray-800 dark:to-red-900/20 rounded-full w-24 h-24 mx-auto mb-6">
                          <Crown className="h-12 w-12 text-red-500 mx-auto mt-3" />
                        </div>
                        <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-3">Premium Feature</h3>
                        <p className="text-gray-500 dark:text-gray-500 max-w-md mx-auto mb-4">
                          PDF viewer is available for premium users. Upgrade your plan to view PDF documents.
                        </p>
                        <Button
                          onClick={() => router.push("/dashboard/subscription")}
                          className="bg-gradient-to-r from-[#130F4D] to-blue-600 hover:from-[#0F0B3E] hover:to-blue-700 text-white"
                        >
                          🚀 Upgrade Now
                        </Button>
                      </div>
                    </div>
                  ) : pdfLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin h-12 w-12 border-4 border-[#130F4D] border-t-transparent rounded-full"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading PDF...</p>
                      </div>
                    </div>
                  ) : !selectedResume ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="p-6 bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-800 dark:to-blue-900/20 rounded-full w-24 h-24 mx-auto mb-6">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mt-3" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-3">
                          No Resume Selected
                        </h3>
                        <p className="text-gray-500 dark:text-gray-500 max-w-md mx-auto">
                          Choose a resume from the dropdown to view its PDF content
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center p-4">
                      <canvas
                        ref={canvasRef}
                        className="max-w-full h-auto shadow-lg border border-gray-300 dark:border-gray-600"
                        style={{
                          transform: `rotate(${rotation}deg)`,
                          transition: "transform 0.3s ease",
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
