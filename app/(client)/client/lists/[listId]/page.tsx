import Link from "next/link"
import { notFound } from "next/navigation"
import {
    ArrowLeft,
    ShoppingCart,
    Trash2,
    Pencil,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WholesaleGate } from "@/components/client/wholesale-gate"
import { EmptyState } from "@/components/client/empty-state"
import { requireClientAuth } from "@/lib/auth-utils"
import { getSavedListById } from "@/actions/client/saved-lists"
import { formatRussianCurrency } from "@/lib/utils/format"
import { ListDetailActions } from "./list-detail-actions"

interface ListDetailPageProps {
    params: Promise<{ listId: string }>
}

export default async function ListDetailPage({ params }: ListDetailPageProps) {
    const session = await requireClientAuth()
    const { listId } = await params

    const list = await getSavedListById(listId)

    if (!list) {
        notFound()
    }

    const isVerified = session.user.isWholesale && session.user.role === "WHOLESALE"

    return (
        <div className="space-y-6">
            {/* Back */}
            <Link href="/client/lists">
                <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Назад к спискам
                </Button>
            </Link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <ListDetailActions listId={list.id} currentName={list.name} listType={list.type} />
                    <p className="text-sm text-muted-foreground mt-1">
                        {list.items.length} товар(ов)
                    </p>
                </div>
                <WholesaleGate isVerified={isVerified} action="Добавить все в корзину">
                    <Button disabled={list.items.length === 0}>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Добавить все в корзину
                    </Button>
                </WholesaleGate>
            </div>

            {/* Items */}
            {list.items.length === 0 ? (
                <EmptyState
                    icon={ShoppingCart}
                    title="Список пуст"
                    description="Добавьте товары из каталога"
                >
                    <Link href="/catalog">
                        <Button variant="outline">Перейти в каталог</Button>
                    </Link>
                </EmptyState>
            ) : (
                <Card>
                    <CardContent className="py-0">
                        <div className="divide-y">
                            {list.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 py-4">
                                    {/* Image */}
                                    {item.product.images?.[0]?.url ? (
                                        <img
                                            src={item.product.images[0].url}
                                            alt={item.product.name}
                                            className="w-12 h-12 rounded object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded bg-muted" />
                                    )}

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {item.product.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.product.category?.name}
                                        </p>
                                    </div>

                                    {/* Qty */}
                                    <div className="text-sm text-muted-foreground">
                                        {Number(item.quantity)} шт
                                    </div>

                                    {/* Price */}
                                    <div className="text-sm font-medium">
                                        {formatRussianCurrency(Number(item.product.wholesalePrice))}
                                    </div>

                                    {/* Availability */}
                                    {item.product.isActive && Number(item.product.stockQuantity) > 0 ? (
                                        <Badge variant="success" className="text-xs">В наличии</Badge>
                                    ) : (
                                        <Badge variant="destructive" className="text-xs">Нет в наличии</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
