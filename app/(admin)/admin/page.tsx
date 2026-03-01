import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Package,
    Users,
    ShoppingCart,
    TrendingUp,
    DollarSign,
    Clock,
} from "lucide-react"
import { formatRussianCurrency } from "@/lib/utils/format"

async function getDashboardStats() {
    const [
        totalProducts,
        totalCategories,
        totalUsers,
        totalOrders,
        pendingOrders,
        todayOrders,
        totalRevenue,
        wholesaleUsers,
    ] = await Promise.all([
        prisma.product.count({ where: { isActive: true } }),
        prisma.category.count({ where: { isActive: true } }),
        prisma.user.count(),
        prisma.order.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            },
        }),
        prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { paymentStatus: "PAID" },
        }),
        prisma.user.count({ where: { isWholesale: true } }),
    ])

    return {
        totalProducts,
        totalCategories,
        totalUsers,
        totalOrders,
        pendingOrders,
        todayOrders,
        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
        wholesaleUsers,
    }
}

async function getRecentOrders() {
    return prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: { name: true, email: true },
            },
        },
    })
}

export default async function AdminDashboardPage() {
    const stats = await getDashboardStats()
    const recentOrders = await getRecentOrders()

    const statCards = [
        {
            title: "Всего товаров",
            value: stats.totalProducts,
            icon: Package,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
        },
        {
            title: "Клиентов",
            value: stats.totalUsers,
            icon: Users,
            color: "text-green-500",
            bgColor: "bg-green-500/10",
        },
        {
            title: "Заказов",
            value: stats.totalOrders,
            icon: ShoppingCart,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
        },
        {
            title: "Выручка",
            value: formatRussianCurrency(stats.totalRevenue),
            icon: DollarSign,
            color: "text-yellow-500",
            bgColor: "bg-yellow-500/10",
        },
        {
            title: "Ожидают обработки",
            value: stats.pendingOrders,
            icon: Clock,
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
        },
        {
            title: "Заказов сегодня",
            value: stats.todayOrders,
            icon: TrendingUp,
            color: "text-cyan-500",
            bgColor: "bg-cyan-500/10",
        },
    ]

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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Панель управления</h1>
                <p className="text-muted-foreground">
                    Обзор статистики магазина
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {statCards.map((card) => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {card.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${card.bgColor}`}>
                                <card.icon className={`h-4 w-4 ${card.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Последние заказы</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentOrders.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                Заказов пока нет
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {recentOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {order.orderNumber}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.user.name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">
                                                {formatRussianCurrency(Number(order.totalAmount))}
                                            </p>
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded text-xs ${statusColors[order.status]
                                                    }`}
                                            >
                                                {statusLabels[order.status]}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Быстрая статистика</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <span className="text-muted-foreground">Категорий</span>
                                <span className="font-medium">{stats.totalCategories}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <span className="text-muted-foreground">Оптовых клиентов</span>
                                <span className="font-medium">{stats.wholesaleUsers}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <span className="text-muted-foreground">
                                    Средний чек
                                </span>
                                <span className="font-medium">
                                    {stats.totalOrders > 0
                                        ? formatRussianCurrency(
                                            stats.totalRevenue / stats.totalOrders
                                        )
                                        : "—"}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
