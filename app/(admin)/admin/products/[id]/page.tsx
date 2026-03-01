import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"
import { ProductForm } from "../product-form"

function serializeProductForClient(product: {
    id: string
    name: string
    slug: string
    description: string | null
    shortDescription: string | null
    retailPrice: { toNumber(): number }
    wholesalePrice: { toNumber(): number }
    costPrice: { toNumber(): number } | null
    unit: string
    minOrderQuantity: { toNumber(): number }
    stepQuantity: { toNumber(): number }
    stockQuantity: { toNumber(): number }
    lowStockThreshold: { toNumber(): number }
    isActive: boolean
    isHit: boolean
    isNew: boolean
    metaTitle: string | null
    metaDescription: string | null
    originCountry: string
    categoryId: string
    images: {
        id: string
        url: string
        alt: string | null
        displayOrder: number
        isPrimary: boolean
    }[]
}) {
    return {
        ...product,
        retailPrice: product.retailPrice.toNumber(),
        wholesalePrice: product.wholesalePrice.toNumber(),
        costPrice: product.costPrice?.toNumber() ?? null,
        minOrderQuantity: product.minOrderQuantity.toNumber(),
        stepQuantity: product.stepQuantity.toNumber(),
        stockQuantity: product.stockQuantity.toNumber(),
        lowStockThreshold: product.lowStockThreshold.toNumber(),
    }
}

interface PageProps {
    params: Promise<{ id: string }>
}

async function getProduct(id: string) {
    return prisma.product.findUnique({
        where: { id },
        include: {
            images: {
                orderBy: { displayOrder: "asc" },
            },
        },
    })
}

async function getCategories() {
    return prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
    })
}

export default async function EditProductPage({ params }: PageProps) {
    const { id } = await params
    const [product, categories] = await Promise.all([
        getProduct(id),
        getCategories(),
    ])

    if (!product) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/admin/products">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Редактировать товар</h1>
                    <p className="text-muted-foreground">{product.name}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Данные товара</CardTitle>
                </CardHeader>
                <CardContent>
                    <ProductForm product={serializeProductForClient(product)} categories={categories} />
                </CardContent>
            </Card>
        </div>
    )
}
