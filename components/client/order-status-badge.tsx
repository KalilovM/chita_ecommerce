import { Badge } from "@/components/ui/badge"

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
    PENDING: { label: "Ожидает", variant: "warning" },
    CONFIRMED: { label: "Подтверждён", variant: "default" },
    PREPARING: { label: "Собирается", variant: "secondary" },
    DELIVERING: { label: "Доставляется", variant: "default" },
    DELIVERED: { label: "Доставлен", variant: "success" },
    CANCELLED: { label: "Отменён", variant: "destructive" },
}

interface OrderStatusBadgeProps {
    status: string
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
    const config = STATUS_CONFIG[status] || { label: status, variant: "outline" as const }

    return (
        <Badge variant={config.variant}>
            {config.label}
        </Badge>
    )
}
