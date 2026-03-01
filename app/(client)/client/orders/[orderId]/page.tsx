import Link from "next/link"
import { notFound } from "next/navigation"
import {
    ArrowLeft,
    RefreshCcw,
    AlertTriangle,
    MapPin,
    Clock,
    FileText,
    Truck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { OrderStatusBadge } from "@/components/client/order-status-badge"
import { StatusTimeline } from "@/components/client/status-timeline"
import { WholesaleGate } from "@/components/client/wholesale-gate"
import { requireClientAuth } from "@/lib/auth-utils"
import { getClientOrderById } from "@/actions/client/orders"
import {
    formatRussianCurrency,
    formatRussianDate,
    formatRussianDateTime,
    getUnitLabel,
} from "@/lib/utils/format"

interface OrderDetailPageProps {
    params: Promise<{ orderId: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
    const session = await requireClientAuth()
    const { orderId } = await params

    const order = await getClientOrderById(orderId)

    if (!order) {
        notFound()
    }

    const isVerified = session.user.isWholesale && session.user.role === "WHOLESALE"

    return (
        <div className="space-y-6">
            {/* Back + Header */}
            <div className="flex items-center gap-4">
                <Link href="/client/orders">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Назад к заказам
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-mono">{order.orderNumber}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        от {formatRussianDateTime(order.createdAt)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    {/* Actions */}
                    <WholesaleGate isVerified={isVerified} action="Повторить заказ">
                        <Link href={`/client/orders/${order.id}/reorder`}>
                            <Button variant="outline" size="sm">
                                <RefreshCcw className="h-4 w-4 mr-2" />
                                Повторить заказ
                            </Button>
                        </Link>
                    </WholesaleGate>
                    <Link href={`/client/claims/new?orderId=${order.id}`}>
                        <Button variant="outline" size="sm">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Создать претензию
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Товары</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2 font-medium">Наименование</th>
                                            <th className="pb-2 font-medium text-right">Кол-во</th>
                                            <th className="pb-2 font-medium text-right">Цена</th>
                                            <th className="pb-2 font-medium text-right">Сумма</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items.map((item) => (
                                            <tr key={item.id} className="border-b last:border-0">
                                                <td className="py-3">
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
                                                        <span>{item.productName}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-right">
                                                    {Number(item.quantity)} {getUnitLabel(item.unit, Number(item.quantity))}
                                                </td>
                                                <td className="py-3 text-right">
                                                    {formatRussianCurrency(Number(item.unitPrice))}
                                                </td>
                                                <td className="py-3 text-right font-medium">
                                                    {formatRussianCurrency(Number(item.totalPrice))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <Separator className="my-4" />
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Подытог</span>
                                    <span>{formatRussianCurrency(Number(order.subtotal))}</span>
                                </div>
                                {Number(order.discountAmount) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Скидка ({Number(order.discountPercent)}%)</span>
                                        <span>-{formatRussianCurrency(Number(order.discountAmount))}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Доставка</span>
                                    <span>
                                        {Number(order.deliveryCost) === 0
                                            ? "Бесплатно"
                                            : formatRussianCurrency(Number(order.deliveryCost))}
                                    </span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-base">
                                    <span>Итого</span>
                                    <span>{formatRussianCurrency(Number(order.totalAmount))}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Truck className="h-4 w-4" />
                                Доставка
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span>{order.deliveryAddress}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>
                                    {formatRussianDate(order.deliveryDate)}, {order.deliveryTimeSlot}
                                </span>
                            </div>
                            {order.deliveryNotes && (
                                <div className="flex items-start gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <span className="text-muted-foreground">{order.deliveryNotes}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Documents placeholder */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Документы
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Документы по заказу будут доступны после подтверждения
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Status timeline */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Статус заказа</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StatusTimeline
                                entries={order.statusHistory}
                                currentStatus={order.status}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
