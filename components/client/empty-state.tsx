import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description?: string
    children?: React.ReactNode
    className?: string
}

export function EmptyState({ icon: Icon, title, description, children, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
            <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground/70 mt-1 max-w-md">{description}</p>
            )}
            {children && <div className="mt-4">{children}</div>}
        </div>
    )
}
