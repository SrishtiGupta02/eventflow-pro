import { CalendarHeart } from "lucide-react"
import { cn } from "@/lib/utils"

export function BrandLogo({
  className,
  showText = true,
}: {
  className?: string
  showText?: boolean
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <CalendarHeart className="size-5" />
      </span>
      {showText && (
        <span className="text-base font-semibold tracking-tight text-foreground">
          EventFlow <span className="text-primary">Pro</span>
        </span>
      )}
    </span>
  )
}
