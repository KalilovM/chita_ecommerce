import { cn } from "@/lib/utils"
import { formatRussianDateTime } from "@/lib/utils/format"
import { CheckCircle, Circle, Clock } from "lucide-react"

interface TimelineEntry {
    status: string
    note?: string | null
    createdAt: Date | string
}

interface StatusTimelineProps {
    entries: TimelineEntry[]
    currentStatus: string
}

const ORDER_STATUS_FLOW = [
    { key: "PENDING", label: "Ожидает подтверждения" },
    { key: "CONFIRMED", label: "Подтверждён" },
    { key: "PREPARING", label: "Собирается" },
    { key: "DELIVERING", label: "Доставляется" },
    { key: "DELIVERED", label: "Доставлен" },
]

const CANCELLED_LABEL = "Отменён"

export function StatusTimeline({ entries, currentStatus }: StatusTimelineProps) {
    const isCancelled = currentStatus === "CANCELLED"

    // Build a map of status -> entry for quick lookup
    const entryMap = new Map<string, TimelineEntry>()
    for (const entry of entries) {
        entryMap.set(entry.status, entry)
    }

    const currentIndex = ORDER_STATUS_FLOW.findIndex((s) => s.key === currentStatus)

    return (
        <div className="space-y-0">
            {ORDER_STATUS_FLOW.map((step, index) => {
                const entry = entryMap.get(step.key)
                const isPast = index <= currentIndex && !isCancelled
                const isCurrent = step.key === currentStatus && !isCancelled
                const isLast = index === ORDER_STATUS_FLOW.length - 1

                return (
                    <div key={step.key} className="flex gap-3">
                        {/* Timeline line + dot */}
                        <div className="flex flex-col items-center">
                            <div className={cn(
                                "flex items-center justify-center w-6 h-6 rounded-full border-2 shrink-0",
                                isPast
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : isCancelled && step.key === currentStatus
                                        ? "bg-destructive border-destructive text-destructive-foreground"
                                        : "border-muted-foreground/30 text-muted-foreground/30"
                            )}>
                                {isPast ? (
                                    <CheckCircle className="h-4 w-4" />
                                ) : isCurrent ? (
                                    <Clock className="h-4 w-4" />
                                ) : (
                                    <Circle className="h-3 w-3" />
                                )}
                            </div>
                            {!isLast && (
                                <div className={cn(
                                    "w-0.5 h-8",
                                    isPast && index < currentIndex ? "bg-primary" : "bg-muted-foreground/20"
                                )} />
                            )}
                        </div>

                        {/* Content */}
                        <div className="pb-6">
                            <p className={cn(
                                "text-sm font-medium",
                                isPast ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {step.label}
                            </p>
                            {entry && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {formatRussianDateTime(entry.createdAt)}
                                    {entry.note && ` — ${entry.note}`}
                                </p>
                            )}
                        </div>
                    </div>
                )
            })}

            {/* Cancelled status (shown separately if applicable) */}
            {isCancelled && (
                <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 bg-destructive border-destructive text-destructive-foreground shrink-0">
                            <CheckCircle className="h-4 w-4" />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-destructive">{CANCELLED_LABEL}</p>
                        {entryMap.get("CANCELLED") && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {formatRussianDateTime(entryMap.get("CANCELLED")!.createdAt)}
                                {entryMap.get("CANCELLED")!.note && ` — ${entryMap.get("CANCELLED")!.note}`}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
