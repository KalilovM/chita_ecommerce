import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle } from "lucide-react"

interface VerificationBadgeProps {
    status: "PENDING" | "VERIFIED" | "REJECTED" | null
}

export function VerificationBadge({ status }: VerificationBadgeProps) {
    if (!status) {
        return (
            <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                Не подано
            </Badge>
        )
    }

    switch (status) {
        case "VERIFIED":
            return (
                <Badge variant="success" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Верифицирован
                </Badge>
            )
        case "PENDING":
            return (
                <Badge variant="warning" className="gap-1">
                    <Clock className="h-3 w-3" />
                    На проверке
                </Badge>
            )
        case "REJECTED":
            return (
                <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Отклонено
                </Badge>
            )
    }
}
