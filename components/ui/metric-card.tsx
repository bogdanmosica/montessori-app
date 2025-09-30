import * as React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * MetricCard - A reusable card component with consistent hover animation
 * Used across the app for displaying metrics, stats, and data cards
 */
function MetricCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-shadow duration-200",
        className
      )}
      {...props}
    />
  )
}

export { MetricCard }