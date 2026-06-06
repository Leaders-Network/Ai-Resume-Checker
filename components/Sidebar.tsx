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
import Image from "next/image"

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

export function Sidebar({ children }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [user] = useAuthState(auth)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false)
      }
    }
    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

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

    if (user) {

      loadUserProfile()
    }
  }, [user])



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
          "bg-card border-r border-border transition-all duration-300 fixed z-30 h-full shadow-lg overflow-hidden",
          isOpen ? "w-64" : "w-20",
          "flex flex-col",
        )}
      >
        {/* Brand Header with gradient accent */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b border-border",
          isOpen ? "bg-gradient-to-r from-orange-500/10 to-transparent" : ""
        )}>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <FileText className="h-8 w-8 text-orange-500" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
            </div>
            {isOpen && (
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">ResumeAI</span>
                <p className="text-[10px] text-muted-foreground -mt-0.5 tracking-widest uppercase">Pro Dashboard</p>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="rounded-full h-8 w-8 hover:bg-orange-500/10">
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </Button>
        </div>

        {/* User Profile Section */}
        {user && isOpen && (
          <div className="px-4 py-3 mx-3 my-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-400/5 border border-orange-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full ring-2 ring-orange-400/40 overflow-hidden flex-shrink-0">
                {userProfile?.profileImage || userProfile?.photoURL || user.photoURL ? (
                  <Image
                    src={userProfile?.profileImage || userProfile?.photoURL || user.photoURL || "/placeholder.svg"}
                    alt="Profile"
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {userProfile?.displayName || user.displayName || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 space-y-1 py-4 px-3 overflow-y-auto">
          {routes.map((route) => {
            const isActive = pathname === route.href
            return (
              <Link key={route.href} href={route.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full font-medium justify-start items-center py-2.5 text-sm mb-0.5 rounded-lg transition-all duration-200 relative overflow-hidden",
                    !isOpen && "justify-center px-0",
                    isActive
                      ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 sidebar-active-item font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <route.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? route.color : "")} />
                  {isOpen && <span className="ml-3">{route.label}</span>}
                  {isActive && isOpen && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-500" />
                  )}
                </Button>
              </Link>
            )
          })}
        </div>

        <div className="p-3 space-y-1 border-t border-border">
          <Button
            onClick={toggleDarkMode}
            variant="ghost"
            className={cn("w-full justify-start items-center text-sm font-medium rounded-lg hover:bg-muted transition-colors", !isOpen && "justify-center px-0")}
          >
            {isDarkMode
              ? <Sun className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              : <Moon className="h-4 w-4 text-slate-500 flex-shrink-0" />}
            {isOpen && <span className={`ml-3 ${isDarkMode ? "text-yellow-500" : "text-muted-foreground"}`}>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>}
          </Button>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className={cn("w-full justify-start text-sm font-medium text-red-500 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors", !isOpen && "justify-center px-0")}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {isOpen && <span className="ml-3">Sign Out</span>}
          </Button>
        </div>
      </motion.div>

      <div className={cn("flex-1 overflow-auto transition-all duration-300", isOpen ? "ml-64" : "ml-20")}>
        {children}
      </div>
    </div>
  )
}
