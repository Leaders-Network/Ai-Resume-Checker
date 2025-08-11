"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ScoreProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  score: number
}

const ScoreProgressBar = React.forwardRef<
  HTMLDivElement,
  ScoreProgressBarProps
>(({ className, score, ...props }, ref) => {
  const getScoreColor = (s: number) => {
    if (s >= 70) return "bg-gradient-to-r from-green-500 to-emerald-500"
    if (s >= 40) return "bg-yellow-500"
    return "bg-destructive"
  }

  return (
    <div
      ref={ref}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <div
        className={`h-full w-full flex-1 transition-all ${getScoreColor(score)}`}
        style={{ transform: `translateX(-${100 - (score || 0)}%)` }}
      />
    </div>
  )
})
ScoreProgressBar.displayName = "ScoreProgressBar"

export { ScoreProgressBar }
