import Link from "next/link"
import { AlertTriangle, Plus, Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClaimStatusBadge } from "@/components/client/claim-status-badge"
import { EmptyState } from "@/components/client/empty-state"
import { requireClientAuth } from "@/lib/auth-utils"
import { getClaims } from "@/actions/client/claims"
import { formatRussianDate } from "@/lib/utils/format"
import { RESOLUTION_LABELS } from "@/lib/validators/claim"

export default async function ClaimsPage() {
    await requireClientAuth()

    const claims = await getClaims()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Претензии</h1>
                <Link href="/client/claims/new">
                    <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Создать претензию
                    </Button>
                </Link>
            </div>

            {claims.length === 0 ? (
                <EmptyState
                    icon={AlertTriangle}
                    title="Нет претензий"
                    description="Здесь будут отображаться ваши претензии по заказам"
                />
            ) : (
                <div className="space-y-3">
                    {claims.map((claim) => (
                        <Card key={claim.id}>
                            <CardContent className="py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-sm font-medium">
                                                Заказ {claim.order.orderNumber}
                                            </span>
                                            <ClaimStatusBadge status={claim.status} />
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                            <span>{formatRussianDate(claim.createdAt)}</span>
                                            <span>{claim.items.length} товар(ов)</span>
                                            <span>{RESOLUTION_LABELS[claim.preferredResolution]}</span>
                                        </div>
                                    </div>
                                    <Link href={`/client/claims/${claim.id}`}>
                                        <Button variant="outline" size="sm">
                                            <Eye className="h-4 w-4 mr-2" />
                                            Подробнее
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
