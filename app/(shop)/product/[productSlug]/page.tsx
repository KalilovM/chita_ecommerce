import { notFound } from "next/navigation"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { QuantitySelector } from "@/components/shop/quantity-selector"
import { formatRussianCurrency, getUnitLabel } from "@/lib/utils/format"
import { ShoppingCart, Truck, Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AddToCartButton } from "./add-to-cart-button"

async function getProduct(slug: string) {
    return prisma.product.findUnique({
        where: { slug },
        include: {
            category: true,
            images: {
                orderBy: { displayOrder: "asc" },
            },
        },
    })
}

interface ProductPageProps {
    params: Promise<{ productSlug: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { productSlug } = await params
    const [product, session] = await Promise.all([
        getProduct(productSlug),
        auth(),
    ])

    if (!product || !product.isActive) {
        notFound()
    }

    const isWholesale = session?.user?.isWholesale ?? false
    const price = isWholesale
        ? Number(product.wholesalePrice)
        : Number(product.retailPrice)
    const unitLabel = getUnitLabel(product.unit)
    const isOutOfStock = Number(product.stockQuantity) <= 0

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Link href="/catalog" className="hover:text-foreground">
                    Каталог
                </Link>
                <span>/</span>
                <Link
                    href={`/catalog/${product.category.slug}`}
                    className="hover:text-foreground"
                >
                    {product.category.name}
                </Link>
                <span>/</span>
                <span className="text-foreground">{product.name}</span>
            </nav>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                {/* Images */}
                <div className="space-y-4">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        {product.images.length > 0 ? (
                            <Image
                                src={product.images[0].url}
                                alt={product.images[0].alt || product.name}
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-8xl">
                                🥬
                            </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {product.isHit && <Badge variant="destructive">Хит</Badge>}
                            {product.isNew && <Badge variant="success">Новинка</Badge>}
                            {isOutOfStock && <Badge variant="secondary">Нет в наличии</Badge>}
                        </div>
                    </div>

                    {/* Thumbnail images */}
                    {product.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                            {product.images.slice(0, 4).map((image: { id: string; url: string; alt: string | null }, index: number) => (
                                <button
                                    key={image.id}
                                    className="relative aspect-square rounded-md overflow-hidden bg-muted border-2 border-transparent hover:border-primary transition-colors"
                                >
                                    <Image
                                        src={image.url}
                                        alt={image.alt || `${product.name} ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div>
                    <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

                    {/* Origin */}
                    <p className="text-sm text-muted-foreground mb-4">
                        Страна происхождения: {product.originCountry}
                    </p>

                    {/* Price */}
                    <div className="mb-6">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-primary">
                                {formatRussianCurrency(price)}
                            </span>
                            <span className="text-muted-foreground">/ {unitLabel}</span>
                        </div>
                        {isWholesale && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Розничная цена: {formatRussianCurrency(Number(product.retailPrice))}
                            </p>
                        )}
                    </div>

                    {/* Add to Cart */}
                    <AddToCartButton
                        productId={product.id}
                        minQuantity={Number(product.minOrderQuantity)}
                        stepQuantity={Number(product.stepQuantity)}
                        unit={product.unit}
                        isOutOfStock={isOutOfStock}
                    />

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <Card>
                            <CardContent className="flex items-center gap-3 p-4">
                                <Truck className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-medium">Доставка</p>
                                    <p className="text-xs text-muted-foreground">В день заказа</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex items-center gap-3 p-4">
                                <Shield className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-medium">Качество</p>
                                    <p className="text-xs text-muted-foreground">Гарантируем</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div className="mt-8">
                            <h2 className="font-semibold mb-2">Описание</h2>
                            <p className="text-muted-foreground whitespace-pre-wrap">
                                {product.description}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Back link */}
            <div className="mt-12">
                <Link
                    href={`/catalog/${product.category.slug}`}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Вернуться в {product.category.name}
                </Link>
            </div>
        </div>
    )
}

export async function generateMetadata({ params }: ProductPageProps) {
    const { productSlug } = await params
    const product = await getProduct(productSlug)

    if (!product) {
        return { title: "Товар не найден" }
    }

    return {
        title: product.metaTitle || product.name,
        description:
            product.metaDescription ||
            product.shortDescription ||
            `${product.name} - купить с доставкой в Чите`,
    }
}
