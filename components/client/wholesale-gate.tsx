import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface WholesaleGateProps {
    children: React.ReactNode
    isVerified: boolean
    action?: string
}

/**
 * Wraps wholesale-only actions. If the user is not verified,
 * shows a message with a CTA to complete verification instead.
 */
export function WholesaleGate({ children, isVerified, action }: WholesaleGateProps) {
    if (isVerified) {
        return <>{children}</>
    }

    return (
        <Card className="border-dashed border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="flex items-center gap-4 py-4">
                <ShieldAlert className="h-8 w-8 text-yellow-600 shrink-0" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        {action
                            ? `Для действия «${action}» требуется верификация оптового клиента`
                            : "Требуется верификация оптового клиента"}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        Заполните данные компании в настройках для получения доступа к оптовым функциям
                    </p>
                </div>
                <Link href="/client/settings">
                    <Button size="sm" variant="outline" className="border-yellow-400 text-yellow-700 hover:bg-yellow-100 shrink-0">
                        Пройти верификацию
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}
