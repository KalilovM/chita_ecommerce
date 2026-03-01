import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { ProductGrid, ProductGridSkeleton } from "@/components/shop/product-grid"
import { CategoryNav, CategoryNavHorizontal } from "@/components/shop/category-nav"
import { CatalogFilters } from "./catalog-filters"

async function getCategories() {
    return prisma.category.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { displayOrder: "asc" },
    })
}

async function getProducts(searchParams: { filter?: string; sort?: string; search?: string }) {
    const where: any = { isActive: true }

    if (searchParams.filter === "hit") {
        where.isHit = true
    } else if (searchParams.filter === "new") {
        where.isNew = true
    }

    // Search functionality
    if (searchParams.search) {
        where.OR = [
            { name: { contains: searchParams.search, mode: "insensitive" } },
            { description: { contains: searchParams.search, mode: "insensitive" } },
            { shortDescription: { contains: searchParams.search, mode: "insensitive" } },
        ]
    }

    let orderBy: any = { createdAt: "desc" }
    if (searchParams.sort === "price-asc") {
        orderBy = { retailPrice: "asc" }
    } else if (searchParams.sort === "price-desc") {
        orderBy = { retailPrice: "desc" }
    } else if (searchParams.sort === "name") {
        orderBy = { name: "asc" }
    }

    return prisma.product.findMany({
        where,
        include: {
            images: {
                where: { isPrimary: true },
                take: 1,
            },
        },
        orderBy,
    })
}

interface CatalogPageProps {
    searchParams: Promise<{ filter?: string; sort?: string; search?: string }>
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
    const params = await searchParams
    const [categories, products] = await Promise.all([
        getCategories(),
        getProducts(params),
    ])

    const transformedCategories = categories.map((c: { id: string; name: string; slug: string }) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
    }))

    const transformedProducts = products.map((p: { id: string; name: string; slug: string; retailPrice: unknown; wholesalePrice: unknown; unit: string; isHit: boolean; isNew: boolean; stockQuantity: unknown; images: { url: string; alt: string | null }[] }) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        retailPrice: Number(p.retailPrice),
        wholesalePrice: Number(p.wholesalePrice),
        unit: p.unit,
        isHit: p.isHit,
        isNew: p.isNew,
        stockQuantity: Number(p.stockQuantity),
        images: p.images.map((img) => ({
            url: img.url,
            alt: img.alt ?? undefined,
        })),
    }))

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">
                    {params.search ? `Поиск: "${params.search}"` : "Каталог товаров"}
                </h1>
                {params.search && (
                    <p className="text-muted-foreground mt-2">
                        Найдено товаров: {products.length}
                    </p>
                )}
            </div>

            {/* Mobile category navigation */}
            <div className="md:hidden mb-6">
                <CategoryNavHorizontal categories={transformedCategories} />
            </div>

            <div className="flex gap-8">
                {/* Desktop sidebar */}
                <aside className="hidden md:block w-64 shrink-0">
                    <div className="sticky top-24">
                        <h2 className="font-semibold mb-4">Категории</h2>
                        <CategoryNav categories={transformedCategories} />
                    </div>
                </aside>

                {/* Products */}
                <div className="flex-1">
                    {/* Filters */}
                    <CatalogFilters
                        totalProducts={products.length}
                        currentSort={params.sort}
                        currentSearch={params.search}
                    />

                    {products.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                {params.search
                                    ? `По запросу "${params.search}" ничего не найдено`
                                    : "Товары не найдены"}
                            </p>
                        </div>
                    ) : (
                        <Suspense fallback={<ProductGridSkeleton />}>
                            <ProductGrid products={transformedProducts} />
                        </Suspense>
                    )}
                </div>
            </div>
        </div>
    )
}

export const metadata = {
    title: "Каталог",
    description: "Каталог свежих овощей и фруктов с доставкой по Чите",
}
