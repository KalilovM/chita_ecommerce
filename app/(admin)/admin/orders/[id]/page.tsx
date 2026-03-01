import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Crown, MapPin, Phone, Mail, Calendar } from "lucide-react"
import { notFound } from "next/navigation"
import { formatRussianCurrency, formatRussianDateTime } from "@/lib/utils/format"
import { OrderStatusForm } from "./order-status-form"

interface PageProps {
    params: Promise<{ id: string }>
}

const statusLabels: Record<string, string> = {
    PENDING: "Ожидает",
    CONFIRMED: "Подтверждён",
    PREPARING: "Собирается",
    DELIVERING: "Доставляется",
    DELIVERED: "Доставлен",
    CANCELLED: "Отменён",
}

const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PREPARING: "bg-purple-100 text-purple-800",
    DELIVERING: "bg-cyan-100 text-cyan-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
}

const paymentStatusLabels: Record<string, string> = {
    PENDING: "Ожидает оплаты",
    PAID: "Оплачен",
    FAILED: "Ошибка оплаты",
    REFUNDED: "Возврат",
}

const unitLabels: Record<string, string> = {
    KG: "кг",
    PIECE: "шт",
    BOX: "кор",
    BUNCH: "пуч",
}

async function getOrder(id: string) {
    return prisma.order.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    isWholesale: true,
                    personalDiscount: true,
                },
            },
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            images: {
                                where: { isPrimary: true },
                                take: 1,
                            },
                        },
                    },
                },
            },
            statusHistory: {
                orderBy: { createdAt: "desc" },
            },
        },
    })
}

export default async function OrderDetailPage({ params }: PageProps) {
    const { id } = await params
    const order = await getOrder(id)

    if (!order) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/orders">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center space-x-3">
                            <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
                            <Badge className={statusColors[order.status]}>
                                {statusLabels[order.status]}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            Создан {formatRussianDateTime(order.createdAt)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Состав заказа</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50"
                                    >
                                        {item.product.images[0] ? (
                                            <img
                                                src={item.product.images[0].url}
                                                alt={item.productName}
                                                className="h-16 w-16 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
                                                <span className="text-xs text-muted-foreground">
                                                    Нет
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium">{item.productName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {Number(item.quantity)} {unitLabels[item.unit]} ×{" "}
                                                {formatRussianCurrency(Number(item.unitPrice))}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">
                                                {formatRussianCurrency(Number(item.totalPrice))}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Подытог</span>
                                        <span>
                                            {formatRussianCurrency(Number(order.subtotal))}
                                        </span>
                                    </div>
                                    {Number(order.discountAmount) > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>
                                                Скидка ({Number(order.discountPercent)}%)
                                            </span>
                                            <span>
                                                -{formatRussianCurrency(Number(order.discountAmount))}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Доставка</span>
                                        <span>
                                            {formatRussianCurrency(Number(order.deliveryCost))}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                                        <span>Итого</span>
                                        <span>
                                            {formatRussianCurrency(Number(order.totalAmount))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>История статусов</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {order.statusHistory.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">
                                    История пуста
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {order.statusHistory.map((history) => (
                                        <div
                                            key={history.id}
                                            className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50"
                                        >
                                            <div
                                                className={`mt-1 h-3 w-3 rounded-full ${statusColors[history.status].split(" ")[0]
                                                    }`}
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {statusLabels[history.status]}
                                                </p>
                                                {history.note && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {history.note}
                                                    </p>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatRussianDateTime(history.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status Update */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Изменить статус</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <OrderStatusForm
                                orderId={order.id}
                                currentStatus={order.status}
                            />
                        </CardContent>
                    </Card>

                    {/* Customer */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Покупатель</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="font-medium text-primary">
                                        {order.customerName.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center space-x-1">
                                        <p className="font-medium">{order.customerName}</p>
                                        {order.user.isWholesale && (
                                            <Crown className="h-4 w-4 text-yellow-500" />
                                        )}
                                    </div>
                                    {Number(order.user.personalDiscount) > 0 && (
                                        <p className="text-xs text-green-600">
                                            Скидка {Number(order.user.personalDiscount)}%
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center space-x-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <a
                                        href={`tel:${order.customerPhone}`}
                                        className="hover:text-primary"
                                    >
                                        {order.customerPhone}
                                    </a>
                                </div>
                                {order.customerEmail && (
                                    <div className="flex items-center space-x-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <a
                                            href={`mailto:${order.customerEmail}`}
                                            className="hover:text-primary"
                                        >
                                            {order.customerEmail}
                                        </a>
                                    </div>
                                )}
                            </div>
                            <Link href={`/admin/clients?search=${order.user.email}`}>
                                <Button variant="outline" size="sm" className="w-full">
                                    Профиль клиента
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Delivery */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Доставка</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-start space-x-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                <p className="text-sm">{order.deliveryAddress}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm">
                                    {new Date(order.deliveryDate).toLocaleDateString("ru-RU", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                    })}
                                    , {order.deliveryTimeSlot}
                                </p>
                            </div>
                            {order.deliveryNotes && (
                                <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground mb-1">
                                        Комментарий к доставке
                                    </p>
                                    <p className="text-sm">{order.deliveryNotes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Оплата</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Способ</span>
                                <span className="font-medium">
                                    {order.paymentMethod === "cash"
                                        ? "Наличными"
                                        : order.paymentMethod === "card_on_delivery"
                                            ? "Картой при получении"
                                            : order.paymentMethod}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Статус</span>
                                <span className="font-medium">
                                    {paymentStatusLabels[order.paymentStatus]}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Admin Notes */}
                    {order.adminNotes && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Заметки администратора</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm">{order.adminNotes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
