import { Badge } from "@/components/ui/badge"

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
    SUBMITTED: { label: "Подана", variant: "warning" },
    REVIEWING: { label: "На рассмотрении", variant: "default" },
    RESOLVED: { label: "Решена", variant: "success" },
    REJECTED: { label: "Отклонена", variant: "destructive" },
}

interface ClaimStatusBadgeProps {
    status: string
}

export function ClaimStatusBadge({ status }: ClaimStatusBadgeProps) {
    const config = STATUS_CONFIG[status] || { label: status, variant: "outline" as const }

    return (
        <Badge variant={config.variant}>
            {config.label}
        </Badge>
    )
}
