"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProductAddDialog } from "@/components/shop/product-add-dialog"
import { formatRussianCurrency, getUnitLabel } from "@/lib/utils/format"
import { cn } from "@/lib/utils"
import { useCart } from "@/hooks/use-cart"

interface ProductCardProps {
    product: {
        id: string
        name: string
        slug: string
        price: number
        unit: string
        stepQuantity: number
        minOrderQuantity: number
        isHit?: boolean
        isNew?: boolean
        images?: { url: string; alt?: string }[]
    }
    onAddToCart?: (productId: string, quantity: number) => void
    className?: string
}

export function ProductCard({
    product,
    onAddToCart,
    className,
}: ProductCardProps) {
    const { addItem, isLoading } = useCart()
    const [isAdded, setIsAdded] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [quantity, setQuantity] = useState(product.minOrderQuantity)
    const displayPrice = formatRussianCurrency(product.price)
    const unitLabel = getUnitLabel(product.unit)
    const primaryImage = product.images?.[0]

    const handleOpenDialog = () => {
        setQuantity(product.minOrderQuantity)
        setIsDialogOpen(true)
    }

    const handleAddToCart = async () => {
        if (onAddToCart) {
            onAddToCart(product.id, quantity)
            setIsDialogOpen(false)
            return
        }

        await addItem(product.id, quantity)
        setIsDialogOpen(false)
        setIsAdded(true)
        setTimeout(() => setIsAdded(false), 1500)
    }

    return (
        <Card className={cn("group overflow-hidden", className)}>
            <Link href={`/product/${product.slug}`}>
                <div className="relative aspect-square overflow-hidden bg-muted">
                    {primaryImage ? (
                        <Image
                            src={primaryImage.url}
                            alt={primaryImage.alt || product.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-4xl">
                            🥬
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.isHit && (
                            <Badge variant="destructive" className="text-xs">
                                Хит
                            </Badge>
                        )}
                        {product.isNew && (
                            <Badge variant="success" className="text-xs">
                                Новинка
                            </Badge>
                        )}
                    </div>
                </div>
            </Link>

            <CardContent className="p-4">
                <Link href={`/product/${product.slug}`}>
                    <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
                        {product.name}
                    </h3>
                </Link>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-primary">
                        {displayPrice}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        / {unitLabel}
                    </span>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0">
                <Button
                    onClick={handleOpenDialog}
                    className="w-full"
                    size="sm"
                    disabled={isLoading}
                >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {isAdded ? "Добавлено" : "В корзину"}
                </Button>
            </CardFooter>

            <ProductAddDialog
                open={isDialogOpen}
                product={product}
                quantity={quantity}
                isLoading={isLoading}
                onClose={() => setIsDialogOpen(false)}
                onQuantityChange={setQuantity}
                onConfirm={handleAddToCart}
            />
        </Card>
    )
}

// Skeleton for loading state
export function ProductCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <div className="aspect-square bg-muted animate-pulse" />
            <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                <div className="h-6 w-1/2 bg-muted animate-pulse rounded" />
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <div className="h-9 w-full bg-muted animate-pulse rounded" />
            </CardFooter>
        </Card>
    )
}
