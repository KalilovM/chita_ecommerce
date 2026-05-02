import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Package, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { ProductsTable } from "./products-table"

function serializeProductForClient(product: {
    id: string
    name: string
    slug: string
    price: { toNumber(): number }
    unit: string
    variationName: string | null
    variantGroup: string | null
    packagingType: string | null
    packagingQuantity: { toNumber(): number } | null
    packagingUnit: string | null
    isActive: boolean
    isHit: boolean
    isNew: boolean
    category: {
        id: string
        name: string
        slug: string
    }
    images: { url: string }[]
}) {
    return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price.toNumber(),
        unit: product.unit,
        variationName: product.variationName,
        variantGroup: product.variantGroup,
        packagingType: product.packagingType,
        packagingQuantity: product.packagingQuantity?.toNumber() ?? null,
        packagingUnit: product.packagingUnit,
        isActive: product.isActive,
        isHit: product.isHit,
        isNew: product.isNew,
        category: product.category,
        images: product.images,
    }
}

interface PageProps {
    searchParams: Promise<{
        page?: string
        search?: string
        category?: string
        status?: string
    }>
}

async function getProducts(
    page: number,
    search: string,
    categoryId: string,
    status: string
) {
    const limit = 20
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
        ]
    }

    if (categoryId) {
        where.categoryId = categoryId
    }

    if (status === "active") {
        where.isActive = true
    } else if (status === "inactive") {
        where.isActive = false
    } else if (status === "featured") {
        where.isHit = true
    } else if (status === "new") {
        where.isNew = true
    }

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
                category: {
                    select: { id: true, name: true, slug: true },
                },
                images: {
                    where: { isPrimary: true },
                    take: 1,
                },
            },
        }),
        prisma.product.count({ where }),
    ])

    return {
        products: products.map(serializeProductForClient),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    }
}

async function getCategories() {
    return prisma.category.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
    })
}

async function getProductStats() {
    const [total, active, featured, newItems] = await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { isActive: true } }),
        prisma.product.count({ where: { isHit: true } }),
        prisma.product.count({ where: { isNew: true } }),
    ])

    return { total, active, featured, newItems }
}

export default async function ProductsPage({ searchParams }: PageProps) {
    const params = await searchParams
    const page = parseInt(params.page || "1")
    const search = params.search || ""
    const categoryId = params.category || ""
    const status = params.status || "all"

    const [{ products, pagination }, categories, stats] = await Promise.all([
        getProducts(page, search, categoryId, status),
        getCategories(),
        getProductStats(),
    ])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Товары</h1>
                    <p className="text-muted-foreground">
                        Управление каталогом товаров
                    </p>
                </div>
                <Link href="/admin/products/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Добавить товар
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Всего товаров
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
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
                        <TrendingUp className="h-4 w-4 text-green-500" />
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
                            Хиты
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {stats.featured}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Новинки
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {stats.newItems}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Список товаров</CardTitle>
                </CardHeader>
                <CardContent>
                    <ProductsTable
                        products={products}
                        categories={categories}
                        pagination={pagination}
                        search={search}
                        categoryId={categoryId}
                        status={status}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
