"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
}

export function LoadingSpinner({ 
  size = "md", 
  className,
  ...props 
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center", className)} {...props}>
      <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size])} />
    </div>
  )
}

interface ButtonSpinnerProps {
  className?: string
}

export function ButtonSpinner({ className }: ButtonSpinnerProps) {
  return (
    <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
  )
}
