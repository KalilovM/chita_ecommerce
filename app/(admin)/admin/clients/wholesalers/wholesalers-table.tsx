"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Edit,
    Percent,
} from "lucide-react"
import { formatRussianDate, formatRussianCurrency } from "@/lib/utils/format"
import { EditClientDialog } from "../edit-client-dialog"

interface Wholesaler {
    id: string
    email: string
    name: string
    phone: string | null
    role: string
    isWholesale: boolean
    personalDiscount: any
    createdAt: Date
    totalSpent: number
    _count: {
        orders: number
    }
}

interface WholesalersTableProps {
    wholesalers: Wholesaler[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    search: string
}

export function WholesalersTable({
    wholesalers,
    pagination,
    search,
}: WholesalersTableProps) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState(search)
    const [editingClient, setEditingClient] = useState<Wholesaler | null>(null)

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (searchQuery) params.set("search", searchQuery)
        router.push(`/admin/clients/wholesalers?${params.toString()}`)
    }

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams()
        params.set("page", newPage.toString())
        if (search) params.set("search", search)
        router.push(`/admin/clients/wholesalers?${params.toString()}`)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Поиск по имени, email или телефону..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-9"
                    />
                </div>
                <Button onClick={handleSearch}>Найти</Button>
            </div>

            <div className="border rounded-lg">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-medium">Клиент</th>
                            <th className="text-left p-3 font-medium">Контакты</th>
                            <th className="text-left p-3 font-medium">Заказы</th>
                            <th className="text-left p-3 font-medium">Оборот</th>
                            <th className="text-left p-3 font-medium">Скидка</th>
                            <th className="text-left p-3 font-medium">Дата регистрации</th>
                            <th className="text-right p-3 font-medium">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {wholesalers.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                    Оптовые клиенты не найдены
                                </td>
                            </tr>
                        ) : (
                            wholesalers.map((client) => (
                                <tr key={client.id} className="border-b last:border-0">
                                    <td className="p-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                                <span className="text-sm font-medium text-yellow-800">
                                                    {client.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium">{client.name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <p className="text-sm">{client.email}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {client.phone || "—"}
                                        </p>
                                    </td>
                                    <td className="p-3">
                                        <span className="font-medium">{client._count.orders}</span>
                                    </td>
                                    <td className="p-3">
                                        <span className="font-medium text-green-600">
                                            {formatRussianCurrency(client.totalSpent)}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        {Number(client.personalDiscount) > 0 ? (
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                <Percent className="h-3 w-3 mr-1" />
                                                {Number(client.personalDiscount)}%
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-sm text-muted-foreground">
                                        {formatRussianDate(client.createdAt)}
                                    </td>
                                    <td className="p-3 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingClient(client)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
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
                        Показано {wholesalers.length} из {pagination.total}
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

            {editingClient && (
                <EditClientDialog
                    client={editingClient}
                    onClose={() => setEditingClient(null)}
                />
            )}
        </div>
    )
}
