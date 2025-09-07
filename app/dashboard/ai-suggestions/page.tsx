"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Sparkles, Copy, CheckCircle, XCircle, Lightbulb } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
// import { useRouter } from "next/navigation"
import { toast, Toaster } from "react-hot-toast"

interface Resume {
  fileName: string
  matches: string[]
  missing: string[]
  score: number
  content: string
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

interface Suggestion {
  title: string
  content: string
  type: "improvement" | "addition" | "formatting"
}

export default function AISuggestionsPage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [keywords, setKeywords] = useState<KeywordCategory | null>(null)
  const [selectedResume, setSelectedResume] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("improvements")
  const [suggestions, setSuggestions] = useState<{
    improvements: Suggestion[]
    additions: Suggestion[]
    formatting: Suggestion[]
  }>({
    improvements: [],
    additions: [],
    formatting: [],
  })
  const [customPrompt, setCustomPrompt] = useState("")

  useEffect(() => {
    const storedResumes = sessionStorage.getItem("resumes")
    const storedKeywords = sessionStorage.getItem("keywordCategories")

    if (storedResumes) {
      const parsedResumes = JSON.parse(storedResumes)
      setResumes(parsedResumes)
      if (parsedResumes.length > 0) {
        setSelectedResume(parsedResumes[0].fileName)
      }
    }

    if (storedKeywords) {
      setKeywords(JSON.parse(storedKeywords))
    }

    setLoading(false)
  }, [])

  const getCurrentResume = () => {
    return resumes.find((r) => r.fileName === selectedResume)
  }

  const generateSuggestions = () => {
    const resume = getCurrentResume()
    if (!resume) return

    setGenerating(true)
    toast
      .promise(
        // Simulate AI processing time
        new Promise<void>((resolve) => {
          setTimeout(() => {
            // Generate suggestions based on resume content and keywords
            const newSuggestions = {
              improvements: generateImprovementSuggestions(resume),
              additions: generateAdditionSuggestions(resume),
              formatting: generateFormattingSuggestions(resume),
            }
            setSuggestions(newSuggestions)
            resolve()
          }, 2000)
        }),
        {
          loading: "Generating AI suggestions...",
          success: "Suggestions generated successfully!",
          error: "Failed to generate suggestions.",
        },
      )
      .finally(() => setGenerating(false))
  }

  const generateImprovementSuggestions = (resume: Resume): Suggestion[] => {
    const suggestions: Suggestion[] = []

    // Check for missing keywords
    if (resume.missing && resume.missing.length > 0) {
      suggestions.push({
        title: "Add Missing Keywords",
        content: `Your resume is missing these important keywords: ${resume.missing
          .slice(0, 5)
          .join(", ")}. Consider incorporating them into your experience or skills sections.`,
        type: "improvement",
      })
    }

    // Check for skills section
    if (!resume.content.toLowerCase().includes("skills") && !resume.content.toLowerCase().includes("expertise")) {
      suggestions.push({
        title: "Add a Skills Section",
        content:
          "Your resume would benefit from a dedicated Skills or Technical Expertise section that clearly highlights your capabilities.",
        type: "improvement",
      })
    }

    // Check for quantifiable achievements
    if (
      !resume.content.toLowerCase().includes("increased") &&
      !resume.content.toLowerCase().includes("decreased") &&
      !resume.content.toLowerCase().includes("improved") &&
      !resume.content.toLowerCase().includes("reduced") &&
      !resume.content.toLowerCase().includes("%")
    ) {
      suggestions.push({
        title: "Add Quantifiable Achievements",
        content:
          "Your resume lacks quantifiable achievements. Add metrics and percentages to demonstrate your impact, such as 'Increased sales by 20%' or 'Reduced costs by $10,000'.",
        type: "improvement",
      })
    }

    // Check for action verbs
    const actionVerbs = ["led", "managed", "developed", "created", "implemented", "designed", "analyzed"]
    const hasActionVerbs = actionVerbs.some((verb) => resume.content.toLowerCase().includes(verb))
    if (!hasActionVerbs) {
      suggestions.push({
        title: "Use Strong Action Verbs",
        content:
          "Your resume could benefit from stronger action verbs. Begin bullet points with words like 'Led', 'Developed', 'Implemented', or 'Designed' to make your achievements more impactful.",
        type: "improvement",
      })
    }

    return suggestions
  }

  const generateAdditionSuggestions = (resume: Resume): Suggestion[] => {
    const suggestions: Suggestion[] = []

    // Suggest adding certifications
    if (
      !resume.content.toLowerCase().includes("certification") &&
      !resume.content.toLowerCase().includes("certified") &&
      !resume.content.toLowerCase().includes("certificate")
    ) {
      suggestions.push({
        title: "Add Relevant Certifications",
        content:
          "Consider adding industry-relevant certifications to strengthen your profile. Even if you're currently pursuing them, listing certifications in progress can be valuable.",
        type: "addition",
      })
    }

    // Suggest adding projects
    if (!resume.content.toLowerCase().includes("project")) {
      suggestions.push({
        title: "Add Project Experience",
        content:
          "Include relevant projects you've worked on, especially if they demonstrate skills that are important for the position. Describe your role, technologies used, and outcomes.",
        type: "addition",
      })
    }

    // Suggest adding professional summary
    if (
      !resume.content.toLowerCase().includes("summary") &&
      !resume.content.toLowerCase().includes("objective") &&
      !resume.content.toLowerCase().includes("profile")
    ) {
      suggestions.push({
        title: "Add a Professional Summary",
        content:
          "Begin your resume with a concise professional summary that highlights your experience, key skills, and career goals. This gives employers a quick overview of your qualifications.",
        type: "addition",
      })
    }

    // Suggest adding technical skills
    if (keywords?.skills && keywords.skills.length > 0) {
      const missingTechSkills = keywords.skills.filter(
        (skill) => !resume.content.toLowerCase().includes(skill.toLowerCase()),
      )
      if (missingTechSkills.length > 0) {
        suggestions.push({
          title: "Add Technical Skills",
          content: `Consider adding these relevant technical skills to your resume: ${missingTechSkills.join(
            ", ",
          )}. These are important keywords for the positions you're targeting.`,
          type: "addition",
        })
      }
    }

    return suggestions
  }

  const generateFormattingSuggestions = (resume: Resume): Suggestion[] => {
    const suggestions: Suggestion[] = []

    // Check for consistent formatting
    if (resume.content.includes("_") || resume.content.includes("*")) {
      suggestions.push({
        title: "Use Consistent Formatting",
        content:
          "Your resume appears to have inconsistent formatting. Ensure consistent use of bold, italics, and bullet points throughout the document for a professional appearance.",
        type: "formatting",
      })
    }

    // Check for bullet points
    if (!resume.content.includes("•") && !resume.content.includes("-") && !resume.content.includes("*")) {
      suggestions.push({
        title: "Use Bullet Points",
        content:
          "Consider using bullet points to list your achievements and responsibilities. This makes your resume more scannable and easier to read quickly.",
        type: "formatting",
      })
    }

    // Check for section headers
    const sectionHeaders = ["experience", "education", "skills", "projects", "certifications"]
    const hasSectionHeaders = sectionHeaders.some((header) =>
      resume.content.toLowerCase().includes(header.toLowerCase()),
    )
    if (!hasSectionHeaders) {
      suggestions.push({
        title: "Add Clear Section Headers",
        content:
          "Your resume would benefit from clear section headers (like EXPERIENCE, EDUCATION, SKILLS) to organize information and improve readability.",
        type: "formatting",
      })
    }

    // Check for contact information
    if (
      !resume.content.toLowerCase().includes("email") &&
      !resume.content.toLowerCase().includes("@") &&
      !resume.content.toLowerCase().includes("phone") &&
      !resume.content.toLowerCase().includes("linkedin")
    ) {
      suggestions.push({
        title: "Add Complete Contact Information",
        content:
          "Ensure your resume includes complete contact information: phone number, professional email, and LinkedIn profile at the top of your resume.",
        type: "formatting",
      })
    }

    return suggestions
  }

  const handleCustomSuggestion = () => {
    if (!customPrompt.trim()) {
      toast.error("Please enter a prompt for the AI")
      return
    }

    setGenerating(true)
    toast
      .promise(
        // Simulate AI processing time
        new Promise<void>((resolve) => {
          setTimeout(() => {
            // Generate a custom suggestion based on the prompt
            const newSuggestion: Suggestion = {
              title: "Custom Suggestion",
              content: generateCustomSuggestionContent(customPrompt),
              type: "improvement",
            }

            setSuggestions((prev) => ({
              ...prev,
              improvements: [...prev.improvements, newSuggestion],
            }))

            setCustomPrompt("")
            resolve()
          }, 2000)
        }),
        {
          loading: "Generating custom suggestion...",
          success: "Custom suggestion generated!",
          error: "Failed to generate suggestion.",
        },
      )
      .finally(() => setGenerating(false))
  }

  const generateCustomSuggestionContent = (prompt: string): string => {
    // In a real implementation, this would call an AI API
    // For now, we'll generate some placeholder text based on the prompt
    const resume = getCurrentResume()
    if (!resume) return "Unable to generate suggestion without a resume."

    const responses = [
      `Based on your resume and the prompt "${prompt}", I recommend focusing on highlighting your achievements more clearly with quantifiable metrics.`,
      `Considering your experience and the request to "${prompt}", try reorganizing your skills section to prioritize the most relevant technologies first.`,
      `To address "${prompt}", consider adding more specific examples of projects where you demonstrated leadership and problem-solving abilities.`,
      `For your question about "${prompt}", I suggest emphasizing your collaborative experiences and team contributions more prominently in your work history.`,
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">Loading AI suggestions...</p>
          </div>
        </div>
    )
  }

  if (resumes.length === 0) {
    return (

        <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>No Resumes Found</CardTitle>
              <CardDescription>Upload and analyze resumes to get AI-powered suggestions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/dashboard">
                <Button className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

    )
  }

  const currentResume = getCurrentResume()

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4 md:p-8 w-full">
        <Toaster />
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold text-[#130F4D] dark:text-white">AI-Powered Resume Suggestions</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Get intelligent recommendations to improve your resume
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card className="border-2 border-primary/10">
                <CardHeader>
                  <CardTitle className="text-lg">Resume Selection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Select value={selectedResume || ""} onValueChange={setSelectedResume}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a resume" />
                      </SelectTrigger>
                      <SelectContent>
                        {resumes.map((resume) => (
                          <SelectItem key={resume.fileName} value={resume.fileName}>
                            {resume.fileName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full" onClick={generateSuggestions} disabled={!selectedResume || generating}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Suggestions
                  </Button>

                  <div className="space-y-2 pt-4 border-t">
                    <p className="text-sm font-medium">Custom AI Prompt</p>
                    <Textarea
                      placeholder="Ask the AI for specific advice..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleCustomSuggestion}
                      disabled={!selectedResume || generating || !customPrompt.trim()}
                    >
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Get Custom Advice
                    </Button>
                  </div>

                  <div className="pt-4 border-t">
                    <Link href="/dashboard/result">
                      <Button variant="outline" className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Results
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <Card className="border-2 border-primary/10">
                <CardHeader className="pb-2 bg-primary/5">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">
                      {currentResume?.fileName ? `Suggestions for ${currentResume.fileName}` : "Select a Resume"}
                    </CardTitle>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                      <TabsList>
                        <TabsTrigger value="improvements" className="text-xs px-2 py-1">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Improvements
                        </TabsTrigger>
                        <TabsTrigger value="additions" className="text-xs px-2 py-1">
                          <Sparkles className="mr-1 h-3 w-3" />
                          Additions
                        </TabsTrigger>
                        <TabsTrigger value="formatting" className="text-xs px-2 py-1">
                          <XCircle className="mr-1 h-3 w-3" />
                          Formatting
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
               <CardContent className="pt-6">
  {!currentResume ? (
    <div className="text-center py-12">
      <Sparkles className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600" />
      <h3 className="mt-4 text-lg font-medium">Select a Resume</h3>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        Choose a resume from the dropdown to get AI-powered suggestions
      </p>
    </div>
  ) : suggestions.improvements.length === 0 &&
    suggestions.additions.length === 0 &&
    suggestions.formatting.length === 0 ? (
    <div className="text-center py-12">
      <Sparkles className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600" />
      <h3 className="mt-4 text-lg font-medium">No Suggestions Yet</h3>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        Click &quot;Generate Suggestions&quot; to get AI-powered recommendations
      </p>
    </div>
  ) : (
    <Tabs defaultValue="improvements" className="w-full mt-4">
      <TabsList
        className="w-full flex gap-2 overflow-x-auto px-1 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-900/60"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <TabsTrigger value="improvements" className="min-w-[140px] whitespace-nowrap py-2 px-4 text-sm">Improvements</TabsTrigger>
        <TabsTrigger value="additions" className="min-w-[140px] whitespace-nowrap py-2 px-4 text-sm">Additions</TabsTrigger>
        <TabsTrigger value="formatting" className="min-w-[140px] whitespace-nowrap py-2 px-4 text-sm">Formatting</TabsTrigger>
      </TabsList>

      <TabsContent value="improvements" className="mt-0 space-y-4">
        {suggestions.improvements.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No improvement suggestions available for this resume.
            </p>
          </div>
        ) : (
          suggestions.improvements.map((suggestion, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-blue-50 dark:bg-blue-900/20 py-3">
                <CardTitle className="text-base flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                  {suggestion.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-gray-700 dark:text-gray-300">{suggestion.content}</p>
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-gray-800 py-2 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(suggestion.content)}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </TabsContent>

      <TabsContent value="additions" className="mt-0 space-y-4">
        {suggestions.additions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No addition suggestions available for this resume.
            </p>
          </div>
        ) : (
          suggestions.additions.map((suggestion, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-green-50 dark:bg-green-900/20 py-3">
                <CardTitle className="text-base flex items-center">
                  <Sparkles className="h-4 w-4 text-green-500 mr-2" />
                  {suggestion.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-gray-700 dark:text-gray-300">{suggestion.content}</p>
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-gray-800 py-2 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(suggestion.content)}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </TabsContent>

      <TabsContent value="formatting" className="mt-0 space-y-4">
        {suggestions.formatting.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No formatting suggestions available for this resume.
            </p>
          </div>
        ) : (
          suggestions.formatting.map((suggestion, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-purple-50 dark:bg-purple-900/20 py-3">
                <CardTitle className="text-base flex items-center">
                  <XCircle className="h-4 w-4 text-purple-500 mr-2" />
                  {suggestion.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-gray-700 dark:text-gray-300">{suggestion.content}</p>
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-gray-800 py-2 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(suggestion.content)}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </TabsContent>
    </Tabs>
  )}
</CardContent>

              </Card>
            </div>
          </div>
        </div>
      </div>
  )
}
