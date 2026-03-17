import { notFound } from "next/navigation"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatRussianCurrency, getUnitLabel } from "@/lib/utils/format"
import { Truck, Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AddToCartButton } from "./add-to-cart-button"

async function getProduct(slug: string) {
    const product = await prisma.product.findUnique({
        where: { slug },
        include: {
            category: true,
            images: {
                orderBy: { displayOrder: "asc" },
            },
        },
    })

    if (!product) {
        return null
    }

    const siblingVariants = product.variantGroup
        ? await prisma.product.findMany({
            where: {
                variantGroup: product.variantGroup,
                isActive: true,
            },
            orderBy: [{ variationName: "asc" }, { name: "asc" }],
            select: {
                id: true,
                slug: true,
                name: true,
                variationName: true,
            },
        })
        : []

    return { product, siblingVariants }
}

interface ProductPageProps {
    params: Promise<{ productSlug: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { productSlug } = await params
    const productData = await getProduct(productSlug)

    if (!productData || !productData.product.isActive) {
        notFound()
    }

    const { product, siblingVariants } = productData
    const price = Number(product.price)
    const unitLabel = getUnitLabel(product.unit)

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Link href="/catalog" className="hover:text-foreground">
                    ÐšÐ°Ñ‚Ð°Ð»Ð¾Ð³
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
                                ðŸ¥¬
                            </div>
                        )}

                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {product.isHit && <Badge variant="destructive">Ð¥Ð¸Ñ‚</Badge>}
                            {product.isNew && <Badge variant="success">ÐÐ¾Ð²Ð¸Ð½ÐºÐ°</Badge>}
                        </div>
                    </div>

                    {product.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                            {product.images.slice(0, 4).map((image, index) => (
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

                    <p className="text-sm text-muted-foreground mb-4">
                        Ð¡Ñ‚Ñ€Ð°Ð½Ð° Ð¿Ñ€Ð¾Ð¸ÑÑ…Ð¾Ð¶Ð´ÐµÐ½Ð¸Ñ: {product.originCountry}
                    </p>

                    {product.packagingType && (
                        <p className="text-sm text-muted-foreground mb-4">
                            Packaging: {product.packagingType}
                            {product.packagingQuantity && product.packagingUnit
                                ? ` · ${Number(product.packagingQuantity)} ${getUnitLabel(product.packagingUnit)}`
                                : ""}
                        </p>
                    )}

                    <div className="mb-6">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-primary">
                                {formatRussianCurrency(price)}
                            </span>
                            <span className="text-muted-foreground">/ {unitLabel}</span>
                        </div>
                    </div>

                    {siblingVariants.length > 1 && (
                        <div className="mb-6">
                            <p className="text-sm font-medium mb-2">Variants</p>
                            <div className="flex flex-wrap gap-2">
                                {siblingVariants.map((variant) => (
                                    <Link key={variant.id} href={`/product/${variant.slug}`}>
                                        <Badge variant={variant.id === product.id ? "default" : "outline"}>
                                            {variant.variationName || variant.name}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    <AddToCartButton
                        productId={product.id}
                        minQuantity={Number(product.minOrderQuantity)}
                        stepQuantity={Number(product.stepQuantity)}
                        unit={product.unit}
                    />

                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <Card>
                            <CardContent className="flex items-center gap-3 p-4">
                                <Truck className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-medium">Ð”Ð¾ÑÑ‚Ð°Ð²ÐºÐ°</p>
                                    <p className="text-xs text-muted-foreground">Ð’ Ð´ÐµÐ½ÑŒ Ð·Ð°ÐºÐ°Ð·Ð°</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex items-center gap-3 p-4">
                                <Shield className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-medium">ÐšÐ°Ñ‡ÐµÑÑ‚Ð²Ð¾</p>
                                    <p className="text-xs text-muted-foreground">Ð“Ð°Ñ€Ð°Ð½Ñ‚Ð¸Ñ€ÑƒÐµÐ¼</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {product.description && (
                        <div className="mt-8">
                            <h2 className="font-semibold mb-2">ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ</h2>
                            <p className="text-muted-foreground whitespace-pre-wrap">
                                {product.description}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-12">
                <Link
                    href={`/catalog/${product.category.slug}`}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Ð’ÐµÑ€Ð½ÑƒÑ‚ÑŒÑÑ Ð² {product.category.name}
                </Link>
            </div>
        </div>
    )
}

export async function generateMetadata({ params }: ProductPageProps) {
    const { productSlug } = await params
    const productData = await getProduct(productSlug)

    if (!productData) {
        return { title: "Ð¢Ð¾Ð²Ð°Ñ€ Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½" }
    }

    const { product } = productData

    return {
        title: product.metaTitle || product.name,
        description:
            product.metaDescription ||
            product.shortDescription ||
            `${product.name} - ÐºÑƒÐ¿Ð¸Ñ‚ÑŒ Ñ Ð´Ð¾ÑÑ‚Ð°Ð²ÐºÐ¾Ð¹ Ð² Ð§Ð¸Ñ‚Ðµ`,
    }
}
