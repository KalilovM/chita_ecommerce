"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Edit,
    Trash2,
    ChevronUp,
    ChevronDown,
    Eye,
    EyeOff,
    GripVertical,
} from "lucide-react"
import { deleteCategory, updateCategoryOrder, toggleCategoryStatus } from "@/actions/admin/categories"

interface Category {
    id: string
    name: string
    slug: string
    description: string | null
    imageUrl: string | null
    displayOrder: number
    isActive: boolean
    parentId: string | null
    parent: { id: string; name: string } | null
    _count: {
        products: number
    }
}

interface CategoriesTableProps {
    categories: Category[]
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Удалить категорию "${name}"? Это действие необратимо.`)) {
            return
        }

        setDeletingId(id)
        startTransition(async () => {
            const result = await deleteCategory(id)
            if (result.error) {
                alert(result.error)
            }
            setDeletingId(null)
            router.refresh()
        })
    }

    const handleOrderChange = async (id: string, direction: "up" | "down") => {
        startTransition(async () => {
            await updateCategoryOrder(id, direction)
            router.refresh()
        })
    }

    const handleToggleStatus = async (id: string) => {
        startTransition(async () => {
            await toggleCategoryStatus(id)
            router.refresh()
        })
    }

    return (
        <div className="border rounded-lg">
            <table className="w-full">
                <thead>
                    <tr className="border-b bg-muted/50">
                        <th className="w-10 p-3"></th>
                        <th className="text-left p-3 font-medium">Название</th>
                        <th className="text-left p-3 font-medium">Slug</th>
                        <th className="text-left p-3 font-medium">Родительская</th>
                        <th className="text-left p-3 font-medium">Товаров</th>
                        <th className="text-left p-3 font-medium">Статус</th>
                        <th className="text-right p-3 font-medium">Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                Категории не найдены
                            </td>
                        </tr>
                    ) : (
                        categories.map((category, index) => (
                            <tr key={category.id} className="border-b last:border-0">
                                <td className="p-3">
                                    <div className="flex flex-col items-center space-y-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => handleOrderChange(category.id, "up")}
                                            disabled={index === 0 || isPending}
                                        >
                                            <ChevronUp className="h-4 w-4" />
                                        </Button>
                                        <span className="text-xs text-muted-foreground">
                                            {category.displayOrder}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => handleOrderChange(category.id, "down")}
                                            disabled={index === categories.length - 1 || isPending}
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center space-x-3">
                                        {category.imageUrl ? (
                                            <img
                                                src={category.imageUrl}
                                                alt={category.name}
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
                                            <p className="font-medium">{category.name}</p>
                                            {category.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {category.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <code className="text-sm bg-muted px-2 py-1 rounded">
                                        {category.slug}
                                    </code>
                                </td>
                                <td className="p-3">
                                    {category.parent ? (
                                        <Badge variant="outline">{category.parent.name}</Badge>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </td>
                                <td className="p-3">
                                    <span className="font-medium">{category._count.products}</span>
                                </td>
                                <td className="p-3">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleStatus(category.id)}
                                        disabled={isPending}
                                    >
                                        {category.isActive ? (
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                <Eye className="h-3 w-3 mr-1" />
                                                Активна
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                <EyeOff className="h-3 w-3 mr-1" />
                                                Скрыта
                                            </Badge>
                                        )}
                                    </Button>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center justify-end space-x-1">
                                        <Link href={`/admin/categories/${category.id}`}>
                                            <Button variant="ghost" size="sm">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(category.id, category.name)}
                                            disabled={isPending || deletingId === category.id}
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
    )
}
