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
  const normalizedScore = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0

  const getScoreColor = (s: number) => {
    if (s >= 70) return "bg-green-500"
    if (s >= 40) return "bg-yellow-500"
    return "bg-destructive"
  }

  return (
    <div
      ref={ref}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(normalizedScore)}
      {...props}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${getScoreColor(normalizedScore)}`}
        style={{ width: `${normalizedScore}%` }}
      />
    </div>
  )
})
ScoreProgressBar.displayName = "ScoreProgressBar"

export { ScoreProgressBar }
