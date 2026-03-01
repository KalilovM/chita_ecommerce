import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Users, Crown, Percent, Search } from "lucide-react"
import { ClientsTable } from "./clients-table"

interface PageProps {
    searchParams: Promise<{ page?: string; search?: string; type?: string }>
}

async function getClients(page: number, search: string, type: string) {
    const limit = 20
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
        ]
    }

    if (type === "wholesale") {
        where.isWholesale = true
    } else if (type === "retail") {
        where.isWholesale = false
    }

    const [clients, total] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
                _count: {
                    select: { orders: true },
                },
            },
        }),
        prisma.user.count({ where }),
    ])

    return {
        clients,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    }
}

async function getClientStats() {
    const [total, wholesale, withDiscount] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isWholesale: true } }),
        prisma.user.count({ where: { personalDiscount: { gt: 0 } } }),
    ])

    return { total, wholesale, withDiscount }
}

export default async function ClientsPage({ searchParams }: PageProps) {
    const params = await searchParams
    const page = parseInt(params.page || "1")
    const search = params.search || ""
    const type = params.type || "all"

    const [{ clients, pagination }, stats] = await Promise.all([
        getClients(page, search, type),
        getClientStats(),
    ])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Клиенты</h1>
                    <p className="text-muted-foreground">
                        Управление клиентами магазина
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Всего клиентов
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Link href="/admin/clients/wholesalers">
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Оптовые клиенты
                            </CardTitle>
                            <Crown className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.wholesale}</div>
                            <p className="text-xs text-muted-foreground">
                                Нажмите для управления
                            </p>
                        </CardContent>
                    </Card>
                </Link>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Со скидкой
                        </CardTitle>
                        <Percent className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.withDiscount}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Список клиентов</CardTitle>
                        <div className="flex items-center space-x-2">
                            <Link href="/admin/clients?type=all">
                                <Badge
                                    variant={type === "all" ? "default" : "outline"}
                                    className="cursor-pointer"
                                >
                                    Все
                                </Badge>
                            </Link>
                            <Link href="/admin/clients?type=retail">
                                <Badge
                                    variant={type === "retail" ? "default" : "outline"}
                                    className="cursor-pointer"
                                >
                                    Розничные
                                </Badge>
                            </Link>
                            <Link href="/admin/clients?type=wholesale">
                                <Badge
                                    variant={type === "wholesale" ? "default" : "outline"}
                                    className="cursor-pointer"
                                >
                                    Оптовые
                                </Badge>
                            </Link>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ClientsTable
                        clients={clients}
                        pagination={pagination}
                        search={search}
                        type={type}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
