"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    Crown,
} from "lucide-react"
import { formatRussianCurrency, formatRussianDateTime } from "@/lib/utils/format"

interface OrderItem {
    id: string
    productName: string
    quantity: any
    unit: string
    unitPrice: any
    totalPrice: any
}

interface Order {
    id: string
    orderNumber: string
    status: string
    paymentStatus: string
    totalAmount: any
    customerName: string
    customerPhone: string
    deliveryDate: Date
    deliveryTimeSlot: string
    createdAt: Date
    user: {
        name: string
        email: string
        isWholesale: boolean
    }
    items: OrderItem[]
}

interface OrdersTableProps {
    orders: Order[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    search: string
    status: string
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
    PENDING: "Ожидает",
    PAID: "Оплачен",
    FAILED: "Ошибка",
    REFUNDED: "Возврат",
}

const paymentStatusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    REFUNDED: "bg-gray-100 text-gray-800",
}

export function OrdersTable({
    orders,
    pagination,
    search,
    status,
}: OrdersTableProps) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState(search)
    const [selectedStatus, setSelectedStatus] = useState(status)

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (searchQuery) params.set("search", searchQuery)
        if (selectedStatus !== "all") params.set("status", selectedStatus)
        router.push(`/admin/orders?${params.toString()}`)
    }

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams()
        params.set("page", newPage.toString())
        if (search) params.set("search", search)
        if (status !== "all") params.set("status", status)
        router.push(`/admin/orders?${params.toString()}`)
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Поиск по номеру, имени или телефону..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-9"
                    />
                </div>
                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                    <option value="all">Все статусы</option>
                    <option value="PENDING">Ожидают</option>
                    <option value="CONFIRMED">Подтверждённые</option>
                    <option value="PREPARING">Собираются</option>
                    <option value="DELIVERING">Доставляются</option>
                    <option value="DELIVERED">Доставленные</option>
                    <option value="CANCELLED">Отменённые</option>
                </select>
                <Button onClick={handleSearch}>Найти</Button>
            </div>

            <div className="border rounded-lg overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-medium">Заказ</th>
                            <th className="text-left p-3 font-medium">Клиент</th>
                            <th className="text-left p-3 font-medium">Товаров</th>
                            <th className="text-left p-3 font-medium">Сумма</th>
                            <th className="text-left p-3 font-medium">Доставка</th>
                            <th className="text-left p-3 font-medium">Статус</th>
                            <th className="text-left p-3 font-medium">Оплата</th>
                            <th className="text-right p-3 font-medium">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                                    Заказы не найдены
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id} className="border-b last:border-0">
                                    <td className="p-3">
                                        <div>
                                            <p className="font-medium">{order.orderNumber}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatRussianDateTime(order.createdAt)}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center space-x-2">
                                            <div>
                                                <div className="flex items-center space-x-1">
                                                    <p className="font-medium">{order.customerName}</p>
                                                    {order.user.isWholesale && (
                                                        <Crown className="h-3 w-3 text-yellow-500" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {order.customerPhone}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className="font-medium">{order.items.length}</span>
                                    </td>
                                    <td className="p-3">
                                        <span className="font-medium">
                                            {formatRussianCurrency(Number(order.totalAmount))}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div>
                                            <p className="text-sm">
                                                {new Date(order.deliveryDate).toLocaleDateString("ru-RU")}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {order.deliveryTimeSlot}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <Badge className={statusColors[order.status]}>
                                            {statusLabels[order.status]}
                                        </Badge>
                                    </td>
                                    <td className="p-3">
                                        <Badge className={paymentStatusColors[order.paymentStatus]}>
                                            {paymentStatusLabels[order.paymentStatus]}
                                        </Badge>
                                    </td>
                                    <td className="p-3 text-right">
                                        <Link href={`/admin/orders/${order.id}`}>
                                            <Button variant="ghost" size="sm">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Показано {orders.length} из {pagination.total}
                    </p>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                            {pagination.page} / {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
