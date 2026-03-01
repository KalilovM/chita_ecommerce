import Link from "next/link"
import { redirect } from "next/navigation"
import { ShoppingCart, Search, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OrderStatusBadge } from "@/components/client/order-status-badge"
import { EmptyState } from "@/components/client/empty-state"
import { requireClientAuth } from "@/lib/auth-utils"
import { getClientOrders } from "@/actions/client/orders"
import { formatRussianCurrency, formatRussianDate } from "@/lib/utils/format"
import { OrdersFilterBar } from "./orders-filter-bar"

interface OrdersPageProps {
    searchParams: Promise<{
        status?: string
        search?: string
        dateFrom?: string
        dateTo?: string
    }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
    await requireClientAuth()

    const params = await searchParams
    const statusFilter = (params.status as "active" | "completed" | "cancelled") || undefined

    const orders = await getClientOrders({
        status: statusFilter,
        search: params.search,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Заказы</h1>
            </div>

            {/* Filter bar */}
            <OrdersFilterBar
                currentStatus={params.status}
                currentSearch={params.search}
                currentDateFrom={params.dateFrom}
                currentDateTo={params.dateTo}
            />

            {/* Orders list */}
            {orders.length === 0 ? (
                <EmptyState
                    icon={ShoppingCart}
                    title={statusFilter ? "Нет заказов с таким статусом" : "У вас пока нет заказов"}
                    description={
                        statusFilter
                            ? "Попробуйте изменить фильтры"
                            : "Ваши заказы появятся здесь после оформления"
                    }
                >
                    <Link href="/catalog">
                        <Button variant="outline">Перейти в каталог</Button>
                    </Link>
                </EmptyState>
            ) : (
                <div className="space-y-3">
                    {orders.map((order) => (
                        <Card key={order.id}>
                            <CardContent className="py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="font-mono text-sm font-medium">
                                                {order.orderNumber}
                                            </span>
                                            <OrderStatusBadge status={order.status} />
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                            <span>{formatRussianDate(order.createdAt)}</span>
                                            <span>{order._count.items} товар(ов)</span>
                                            <span className="font-medium text-foreground">
                                                {formatRussianCurrency(Number(order.totalAmount))}
                                            </span>
                                        </div>
                                    </div>
                                    <Link href={`/client/orders/${order.id}`}>
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
