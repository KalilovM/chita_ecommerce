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
    const primaryImage = product.images[0]
    const isUploadedPrimaryImage = primaryImage?.url.startsWith("/uploads/") ?? false

    return (
        <div className="container mx-auto px-4 py-8">
            <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/catalog" className="hover:text-foreground">
                    Каталог
                </Link>
                <span>/</span>
                <Link href={`/catalog/${product.category.slug}`} className="hover:text-foreground">
                    {product.category.name}
                </Link>
                <span>/</span>
                <span className="text-foreground">{product.name}</span>
            </nav>

            <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
                <div className="space-y-4">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                        {primaryImage ? (
                            <Image
                                src={primaryImage.url}
                                alt={primaryImage.alt || product.name}
                                fill
                                className="object-cover"
                                priority
                                unoptimized={isUploadedPrimaryImage}
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-8xl">
                                🧺
                            </div>
                        )}

                        <div className="absolute left-4 top-4 flex flex-col gap-2">
                            {product.isHit && <Badge variant="destructive">Хит</Badge>}
                            {product.isNew && <Badge variant="success">Новинка</Badge>}
                        </div>
                    </div>

                    {product.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                            {product.images.slice(0, 4).map((image, index) => (
                                <button
                                    key={image.id}
                                    className="relative aspect-square overflow-hidden rounded-md border-2 border-transparent bg-muted transition-colors hover:border-primary"
                                >
                                    <Image
                                        src={image.url}
                                        alt={image.alt || `${product.name} ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        unoptimized={image.url.startsWith("/uploads/")}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h1 className="mb-2 text-3xl font-bold">{product.name}</h1>
                    {product.variationName ? (
                        <p className="mb-2 text-sm text-muted-foreground">
                            Вариант: {product.variationName}
                        </p>
                    ) : null}

                    <p className="mb-4 text-sm text-muted-foreground">
                        Страна происхождения: {product.originCountry}
                    </p>

                    {(product.packagingType || product.packagingQuantity) && (
                        <p className="mb-4 text-sm text-muted-foreground">
                            Упаковка: {product.packagingType || "Коробка"}
                            {product.packagingQuantity
                                ? ` — ${Number(product.packagingQuantity)} ${getUnitLabel(
                                    product.packagingUnit || product.unit,
                                    Number(product.packagingQuantity)
                                )}`
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
                            <p className="mb-2 text-sm font-medium">Другие варианты</p>
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
                        packagingQuantity={product.packagingQuantity ? Number(product.packagingQuantity) : null}
                        unit={product.unit}
                    />

                    <div className="mt-8 grid grid-cols-2 gap-4">
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
                                    <p className="text-xs text-muted-foreground">С гарантией поставщика</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {product.description && (
                        <div className="mt-8">
                            <h2 className="mb-2 font-semibold">Описание</h2>
                            <p className="whitespace-pre-wrap text-muted-foreground">
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
                    Вернуться в {product.category.name}
                </Link>
            </div>
        </div>
    )
}

export async function generateMetadata({ params }: ProductPageProps) {
    const { productSlug } = await params
    const productData = await getProduct(productSlug)

    if (!productData) {
        return { title: "Товар не найден" }
    }

    const { product } = productData

    return {
        title: product.metaTitle || product.name,
        description:
            product.metaDescription ||
            product.shortDescription ||
            `${product.name} — купить с доставкой в Чите`,
    }
}
