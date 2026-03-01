import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FolderTree } from "lucide-react"
import Link from "next/link"
import { CategoriesTable } from "./categories-table"

async function getCategories() {
    return prisma.category.findMany({
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        include: {
            _count: {
                select: {
                    products: { where: { isActive: true } },
                },
            },
            parent: {
                select: { id: true, name: true },
            },
        },
    })
}

export default async function CategoriesPage() {
    const categories = await getCategories()

    const stats = {
        total: categories.length,
        active: categories.filter((c) => c.isActive).length,
        withProducts: categories.filter((c) => c._count.products > 0).length,
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Категории</h1>
                    <p className="text-muted-foreground">
                        Управление категориями товаров
                    </p>
                </div>
                <Link href="/admin/categories/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Добавить категорию
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Всего категорий
                        </CardTitle>
                        <FolderTree className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Активных
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {stats.active}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            С товарами
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.withProducts}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Список категорий</CardTitle>
                </CardHeader>
                <CardContent>
                    <CategoriesTable categories={categories} />
                </CardContent>
            </Card>
        </div>
    )
}
