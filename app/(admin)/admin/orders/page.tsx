import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Clock, Truck, CheckCircle } from "lucide-react"
import { formatRussianCurrency } from "@/lib/utils/format"
import { OrdersTable } from "./orders-table"

interface PageProps {
    searchParams: Promise<{
        page?: string
        search?: string
        status?: string
    }>
}

async function getOrders(page: number, search: string, status: string) {
    const limit = 20
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
        where.OR = [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { customerName: { contains: search, mode: "insensitive" } },
            { customerPhone: { contains: search, mode: "insensitive" } },
        ]
    }

    if (status && status !== "all") {
        where.status = status
    }

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
                user: {
                    select: { name: true, email: true, isWholesale: true },
                },
                items: {
                    include: {
                        product: {
                            select: { name: true },
                        },
                    },
                },
            },
        }),
        prisma.order.count({ where }),
    ])

    return {
        orders,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    }
}

async function getOrderStats() {
    const [total, pending, delivering, delivered, todayRevenue] =
        await Promise.all([
            prisma.order.count(),
            prisma.order.count({ where: { status: "PENDING" } }),
            prisma.order.count({ where: { status: "DELIVERING" } }),
            prisma.order.count({ where: { status: "DELIVERED" } }),
            prisma.order.aggregate({
                _sum: { totalAmount: true },
                where: {
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                    paymentStatus: "PAID",
                },
            }),
        ])

    return {
        total,
        pending,
        delivering,
        delivered,
        todayRevenue: Number(todayRevenue._sum.totalAmount || 0),
    }
}

export default async function OrdersPage({ searchParams }: PageProps) {
    const params = await searchParams
    const page = parseInt(params.page || "1")
    const search = params.search || ""
    const status = params.status || "all"

    const [{ orders, pagination }, stats] = await Promise.all([
        getOrders(page, search, status),
        getOrderStats(),
    ])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Заказы</h1>
                <p className="text-muted-foreground">
                    Управление заказами клиентов
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Всего заказов
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Ожидают
                        </CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {stats.pending}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Доставляются
                        </CardTitle>
                        <Truck className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {stats.delivering}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Доставлено
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {stats.delivered}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Выручка сегодня
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatRussianCurrency(stats.todayRevenue)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Список заказов</CardTitle>
                </CardHeader>
                <CardContent>
                    <OrdersTable
                        orders={orders}
                        pagination={pagination}
                        search={search}
                        status={status}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
