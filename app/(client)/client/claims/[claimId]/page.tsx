import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ClaimStatusBadge } from "@/components/client/claim-status-badge"
import { requireClientAuth } from "@/lib/auth-utils"
import { getClaimById } from "@/actions/client/claims"
import { formatRussianDate, formatRussianDateTime } from "@/lib/utils/format"
import {
    ISSUE_TYPE_LABELS,
    RESOLUTION_LABELS,
    CLAIM_STATUS_LABELS,
} from "@/lib/validators/claim"

interface ClaimDetailPageProps {
    params: Promise<{ claimId: string }>
}

export default async function ClaimDetailPage({ params }: ClaimDetailPageProps) {
    await requireClientAuth()
    const { claimId } = await params

    const claim = await getClaimById(claimId)

    if (!claim) {
        notFound()
    }

    return (
        <div className="space-y-6">
            {/* Back */}
            <Link href="/client/claims">
                <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Назад к претензиям
                </Button>
            </Link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">
                        Претензия по заказу {claim.order.orderNumber}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        от {formatRussianDateTime(claim.createdAt)}
                    </p>
                </div>
                <ClaimStatusBadge status={claim.status} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Claim items */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Товары в претензии</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {claim.items.map((item) => (
                                <div key={item.id} className="p-4 border rounded-lg space-y-3">
                                    <div className="flex items-center gap-3">
                                        {item.product?.images?.[0]?.url ? (
                                            <img
                                                src={item.product.images[0].url}
                                                alt={item.productName}
                                                className="w-10 h-10 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-muted" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium">{item.productName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Кол-во: {Number(item.quantity)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Badge variant="outline">
                                            {ISSUE_TYPE_LABELS[item.issueType] || item.issueType}
                                        </Badge>
                                    </div>

                                    {item.description && (
                                        <p className="text-sm text-muted-foreground">
                                            {item.description}
                                        </p>
                                    )}

                                    {/* Photos */}
                                    {item.photos.length > 0 && (
                                        <div className="flex gap-2 flex-wrap">
                                            {item.photos.map((photo, idx) => (
                                                <img
                                                    key={idx}
                                                    src={photo}
                                                    alt={`Фото ${idx + 1}`}
                                                    className="w-20 h-20 rounded object-cover border"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Admin response */}
                    {claim.adminResponse && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Ответ администрации</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm">{claim.adminResponse}</p>
                                {claim.resolvedAt && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Решено: {formatRussianDateTime(claim.resolvedAt)}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Информация</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <span className="text-muted-foreground">Статус:</span>
                                <div className="mt-1">
                                    <ClaimStatusBadge status={claim.status} />
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <span className="text-muted-foreground">Предпочтительное решение:</span>
                                <p className="font-medium mt-0.5">
                                    {RESOLUTION_LABELS[claim.preferredResolution]}
                                </p>
                            </div>
                            <Separator />
                            <div>
                                <span className="text-muted-foreground">Заказ:</span>
                                <p className="mt-0.5">
                                    <Link
                                        href={`/client/orders/${claim.orderId}`}
                                        className="text-primary hover:underline"
                                    >
                                        {claim.order.orderNumber}
                                    </Link>
                                </p>
                            </div>
                            <Separator />
                            <div>
                                <span className="text-muted-foreground">Дата подачи:</span>
                                <p className="mt-0.5">{formatRussianDate(claim.createdAt)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
