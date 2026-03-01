import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Crown, TrendingUp } from "lucide-react"
import { WholesalersTable } from "./wholesalers-table"
import { formatRussianCurrency } from "@/lib/utils/format"

interface PageProps {
    searchParams: Promise<{ page?: string; search?: string }>
}

async function getWholesalers(page: number, search: string) {
    const limit = 20
    const skip = (page - 1) * limit

    const where: any = { isWholesale: true }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
        ]
    }

    const [wholesalers, total] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
                _count: {
                    select: { orders: true },
                },
                orders: {
                    select: { totalAmount: true },
                    where: { paymentStatus: "PAID" },
                },
            },
        }),
        prisma.user.count({ where }),
    ])

    const wholesalersWithStats = wholesalers.map((w) => ({
        ...w,
        totalSpent: w.orders.reduce(
            (sum, order) => sum + Number(order.totalAmount),
            0
        ),
    }))

    return {
        wholesalers: wholesalersWithStats,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    }
}

async function getWholesaleStats() {
    const wholesalers = await prisma.user.findMany({
        where: { isWholesale: true },
        include: {
            orders: {
                select: { totalAmount: true },
                where: { paymentStatus: "PAID" },
            },
        },
    })

    const totalRevenue = wholesalers.reduce(
        (sum, w) =>
            sum + w.orders.reduce((s, o) => s + Number(o.totalAmount), 0),
        0
    )

    const avgDiscount =
        wholesalers.length > 0
            ? wholesalers.reduce((sum, w) => sum + Number(w.personalDiscount), 0) /
            wholesalers.length
            : 0

    return {
        totalWholesalers: wholesalers.length,
        totalRevenue,
        avgDiscount,
    }
}

export default async function WholesalersPage({ searchParams }: PageProps) {
    const params = await searchParams
    const page = parseInt(params.page || "1")
    const search = params.search || ""

    const [{ wholesalers, pagination }, stats] = await Promise.all([
        getWholesalers(page, search),
        getWholesaleStats(),
    ])

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/admin/clients">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Оптовые клиенты</h1>
                    <p className="text-muted-foreground">
                        Управление оптовыми покупателями
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Оптовых клиентов
                        </CardTitle>
                        <Crown className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalWholesalers}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Оборот от оптовиков
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatRussianCurrency(stats.totalRevenue)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Средняя скидка
                        </CardTitle>
                        <Badge variant="outline">{stats.avgDiscount.toFixed(1)}%</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.avgDiscount.toFixed(1)}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Список оптовых клиентов</CardTitle>
                </CardHeader>
                <CardContent>
                    <WholesalersTable
                        wholesalers={wholesalers}
                        pagination={pagination}
                        search={search}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
