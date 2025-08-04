"use client"
import type React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Settings,
  Users,
  BarChart,
  LogOut,
  FileText,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  FileDigit,
  Sparkles,
  Eye,
  User,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, type ReactNode } from "react"
import { useDarkMode } from "@/app/context/DarkModeContext"
import { motion } from "framer-motion"
import { auth, db } from "@/config/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { doc, getDoc } from "firebase/firestore"
import { signOut } from "firebase/auth"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
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

export function Sidebar({ className, children }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [isMobile, setIsMobile] = useState(false)
  const [user, loading] = useAuthState(auth)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsOpen(false)
      }
    }
    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
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

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      color: "text-orange-500",
    },
    {
      label: "Results",
      icon: BarChart,
      href: "/dashboard/result",
      color: "text-orange-600",
    },
    {
      label: "Compare",
      icon: BarChart2,
      href: "/dashboard/compare",
      color: "text-orange-700",
    },
    {
      label: "Visualization",
      icon: FileDigit,
      href: "/dashboard/visualization",
      color: "text-yellow-500",
    },
    {
      label: "PDF Viewer",
      icon: Eye,
      href: "/dashboard/pdf-viewer",
      color: "text-yellow-600",
    },
    {
      label: "AI Suggestions",
      icon: Sparkles,
      href: "/dashboard/ai-suggestions",
      color: "text-yellow-700",
    },
    {
      label: "Subscription",
      icon: Users,
      href: "/dashboard/subscription",
      color: "text-orange-800",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      color: "text-gray-500",
    },
  ]

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      window.location.href = "/signin"
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <div className="flex w-full h-screen overflow-hidden">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "bg-white dark:bg-gray-800 transition-all duration-300 fixed z-30 h-full border-r shadow-md overflow-hidden",
          isOpen ? "w-64" : "w-20",
          "flex flex-col",
        )}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-orange-600" />
            {isOpen && <span className="text-xl font-bold text-orange-600 dark:text-orange-400">ResumeAI</span>}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="rounded-full h-8 w-8">
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </Button>
        </div>

        {/* User Profile Section */}
        {user && isOpen && (
          <div className="px-4 py-2 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
                {userProfile?.profileImage || userProfile?.photoURL || user.photoURL ? (
                  <img
                    src={userProfile?.profileImage || userProfile?.photoURL || user.photoURL || "/placeholder.svg"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-orange-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {userProfile?.displayName || user.displayName || "User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 space-y-2 py-6 px-4 overflow-y-auto">
          {routes.map((route) => (
            <Link key={route.href} href={route.href}>
              <Button
                variant={pathname === route.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full text-gray-700 dark:text-gray-100 font-bold justify-start items-center py-3 text-lg mb-2",
                  !isOpen && "justify-center px-0",
                  pathname === route.href && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
                )}
              >
                <route.icon className={cn("h-5 w-5", route.color)} />
                {isOpen && <span className="ml-3">{route.label}</span>}
              </Button>
            </Link>
          ))}
        </div>

        <div className="p-4 space-y-2 border-t">
          <Button
            onClick={toggleDarkMode}
            variant="ghost"
            className={cn("w-full justify-start items-center", !isOpen && "justify-center px-0")}
          >
            {isDarkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-blue-700" />}
            {isOpen && <span className="ml-3">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>}
          </Button>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className={cn("w-full justify-start text-red-500 text-lg", !isOpen && "justify-center px-0")}
          >
            <LogOut className="h-5 w-5" />
            {isOpen && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </motion.div>

      <div className={cn("flex-1 overflow-auto transition-all duration-300", isOpen ? "ml-64" : "ml-20")}>
        {children}
      </div>
    </div>
  )
}
