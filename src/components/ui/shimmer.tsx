"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  rounded?: "none" | "sm" | "md" | "lg" | "full"
}

const roundedClasses = {
  none: "",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
}

export function Shimmer({ 
  width = "100%", 
  height = "1rem",
  rounded = "md",
  className,
  style,
  ...props 
}: ShimmerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        roundedClasses[rounded],
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  )
}

// Add shimmer animation to global CSS if not already present
// @keyframes shimmer {
//   100% {
//     transform: translateX(100%);
//   }
// }
