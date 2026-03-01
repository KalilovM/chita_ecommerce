import { notFound } from "next/navigation"
import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { ProductGrid, ProductGridSkeleton } from "@/components/shop/product-grid"
import { CategoryNav, CategoryNavHorizontal } from "@/components/shop/category-nav"

async function getCategories() {
    return prisma.category.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { displayOrder: "asc" },
    })
}

async function getCategoryBySlug(slug: string) {
    return prisma.category.findUnique({
        where: { slug },
    })
}

async function getProductsByCategory(categoryId: string) {
    return prisma.product.findMany({
        where: {
            isActive: true,
            categoryId,
        },
        include: {
            images: {
                where: { isPrimary: true },
                take: 1,
            },
        },
        orderBy: { createdAt: "desc" },
    })
}

interface CategoryPageProps {
    params: Promise<{ categorySlug: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { categorySlug } = await params
    const [categories, category] = await Promise.all([
        getCategories(),
        getCategoryBySlug(categorySlug),
    ])

    if (!category) {
        notFound()
    }

    const products = await getProductsByCategory(category.id)

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
            <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
            {category.description && (
                <p className="text-muted-foreground mb-8">{category.description}</p>
            )}

            {/* Mobile category navigation */}
            <div className="md:hidden mb-6">
                <CategoryNavHorizontal
                    categories={transformedCategories}
                    activeSlug={categorySlug}
                />
            </div>

            <div className="flex gap-8">
                {/* Desktop sidebar */}
                <aside className="hidden md:block w-64 shrink-0">
                    <div className="sticky top-24">
                        <h2 className="font-semibold mb-4">Категории</h2>
                        <CategoryNav
                            categories={transformedCategories}
                            activeSlug={categorySlug}
                        />
                    </div>
                </aside>

                {/* Products */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-sm text-muted-foreground">
                            {products.length} товаров
                        </p>
                        <select className="text-sm border rounded-md px-3 py-2 bg-background">
                            <option value="">По умолчанию</option>
                            <option value="price-asc">Сначала дешевые</option>
                            <option value="price-desc">Сначала дорогие</option>
                            <option value="name">По названию</option>
                        </select>
                    </div>

                    <Suspense fallback={<ProductGridSkeleton />}>
                        <ProductGrid products={transformedProducts} />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}

export async function generateMetadata({ params }: CategoryPageProps) {
    const { categorySlug } = await params
    const category = await getCategoryBySlug(categorySlug)

    if (!category) {
        return { title: "Категория не найдена" }
    }

    return {
        title: category.name,
        description: category.description || `${category.name} - свежие продукты с доставкой`,
    }
}
