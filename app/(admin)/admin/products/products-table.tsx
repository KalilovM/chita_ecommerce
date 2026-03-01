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
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Star,
    Sparkles,
} from "lucide-react"
import { formatRussianCurrency } from "@/lib/utils/format"
import { deleteProduct, toggleProductStatus } from "@/actions/admin/products"

interface Product {
    id: string
    name: string
    slug: string
    retailPrice: any
    wholesalePrice: any
    unit: string
    stockQuantity: any
    isActive: boolean
    isHit: boolean
    isNew: boolean
    category: {
        id: string
        name: string
        slug: string
    }
    images: { url: string }[]
}

interface Category {
    id: string
    name: string
}

interface ProductsTableProps {
    products: Product[]
    categories: Category[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    search: string
    categoryId: string
    status: string
}

const unitLabels: Record<string, string> = {
    KG: "кг",
    PIECE: "шт",
    BOX: "кор",
    BUNCH: "пуч",
}

export function ProductsTable({
    products,
    categories,
    pagination,
    search,
    categoryId,
    status,
}: ProductsTableProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [searchQuery, setSearchQuery] = useState(search)
    const [selectedCategory, setSelectedCategory] = useState(categoryId)
    const [selectedStatus, setSelectedStatus] = useState(status)

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (searchQuery) params.set("search", searchQuery)
        if (selectedCategory) params.set("category", selectedCategory)
        if (selectedStatus !== "all") params.set("status", selectedStatus)
        router.push(`/admin/products?${params.toString()}`)
    }

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams()
        params.set("page", newPage.toString())
        if (search) params.set("search", search)
        if (categoryId) params.set("category", categoryId)
        if (status !== "all") params.set("status", status)
        router.push(`/admin/products?${params.toString()}`)
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Удалить товар "${name}"? Это действие необратимо.`)) {
            return
        }

        startTransition(async () => {
            const result = await deleteProduct(id)
            if (result.error) {
                alert(result.error)
            }
            router.refresh()
        })
    }

    const handleToggleStatus = async (id: string) => {
        startTransition(async () => {
            await toggleProductStatus(id)
            router.refresh()
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Поиск по названию..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-9"
                    />
                </div>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                    <option value="">Все категории</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                    <option value="all">Все статусы</option>
                    <option value="active">Активные</option>
                    <option value="inactive">Скрытые</option>
                    <option value="lowstock">Мало на складе</option>
                </select>
                <Button onClick={handleSearch}>Найти</Button>
            </div>

            <div className="border rounded-lg overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-medium">Товар</th>
                            <th className="text-left p-3 font-medium">Категория</th>
                            <th className="text-left p-3 font-medium">Цена розн.</th>
                            <th className="text-left p-3 font-medium">Цена опт.</th>
                            <th className="text-left p-3 font-medium">Остаток</th>
                            <th className="text-left p-3 font-medium">Метки</th>
                            <th className="text-left p-3 font-medium">Статус</th>
                            <th className="text-right p-3 font-medium">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                                    Товары не найдены
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="border-b last:border-0">
                                    <td className="p-3">
                                        <div className="flex items-center space-x-3">
                                            {product.images[0] ? (
                                                <img
                                                    src={product.images[0].url}
                                                    alt={product.name}
                                                    className="h-10 w-10 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                                    <span className="text-xs text-muted-foreground">
                                                        Нет
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium">{product.name}</p>
                                                <code className="text-xs text-muted-foreground">
                                                    {product.slug}
                                                </code>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <Badge variant="outline">{product.category.name}</Badge>
                                    </td>
                                    <td className="p-3">
                                        <span className="font-medium">
                                            {formatRussianCurrency(Number(product.retailPrice))}
                                        </span>
                                        <span className="text-muted-foreground">
                                            /{unitLabels[product.unit]}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className="font-medium text-blue-600">
                                            {formatRussianCurrency(Number(product.wholesalePrice))}
                                        </span>
                                        <span className="text-muted-foreground">
                                            /{unitLabels[product.unit]}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span
                                            className={
                                                Number(product.stockQuantity) <= 0
                                                    ? "text-red-600 font-medium"
                                                    : Number(product.stockQuantity) <= 10
                                                        ? "text-yellow-600 font-medium"
                                                        : ""
                                            }
                                        >
                                            {Number(product.stockQuantity)} {unitLabels[product.unit]}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center space-x-1">
                                            {product.isHit && (
                                                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                                    <Star className="h-3 w-3 mr-1" />
                                                    Хит
                                                </Badge>
                                            )}
                                            {product.isNew && (
                                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                                    <Sparkles className="h-3 w-3 mr-1" />
                                                    Новинка
                                                </Badge>
                                            )}
                                            {!product.isHit && !product.isNew && (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleStatus(product.id)}
                                            disabled={isPending}
                                        >
                                            {product.isActive ? (
                                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    Активен
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    <EyeOff className="h-3 w-3 mr-1" />
                                                    Скрыт
                                                </Badge>
                                            )}
                                        </Button>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center justify-end space-x-1">
                                            <Link href={`/admin/products/${product.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(product.id, product.name)}
                                                disabled={isPending}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
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
                        Показано {products.length} из {pagination.total}
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
