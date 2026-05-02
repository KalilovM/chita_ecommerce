"use client"

import { Minus, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatRussianCurrency, formatQuantity, getUnitLabel } from "@/lib/utils/format"
import { cn } from "@/lib/utils"
import { nextQuantityByStep, previousQuantityByStep, resolvePurchaseStep } from "@/lib/utils/purchase-step"

interface CartItemProps {
    item: {
        id: string
        quantity: number
        product: {
            id: string
            name: string
            slug: string
            price: number
            unit: string
            stepQuantity: number
            minOrderQuantity: number
            packagingQuantity: number | null
            images?: { url: string; alt?: string | null }[]
        }
    }
    onUpdateQuantity: (itemId: string, quantity: number) => void
    onRemove: (itemId: string) => void
    className?: string
}

export function CartItem({
    item,
    onUpdateQuantity,
    onRemove,
    className,
}: CartItemProps) {
    const { product, quantity } = item
    const purchaseStep = resolvePurchaseStep(product.packagingQuantity)
    const price = product.price
    const totalPrice = price * quantity
    const primaryImage = product.images?.[0]

    const handleIncrement = () => {
        onUpdateQuantity(item.id, nextQuantityByStep(quantity, purchaseStep))
    }

    const handleDecrement = () => {
        if (quantity > purchaseStep) {
            onUpdateQuantity(item.id, previousQuantityByStep(quantity, purchaseStep))
        }
    }

    const handleRemove = () => {
        onRemove(item.id)
    }

    return (
        <div className={cn("flex gap-4 py-4", className)}>
            {/* Image */}
            <Link
                href={`/product/${product.slug}`}
                className="shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted"
            >
                {primaryImage ? (
                    <Image
                        src={primaryImage.url}
                        alt={primaryImage.alt || product.name}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-2xl">
                        🥬
                    </div>
                )}
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <Link
                    href={`/product/${product.slug}`}
                    className="font-medium hover:text-primary transition-colors line-clamp-2"
                >
                    {product.name}
                </Link>
                <p className="text-sm text-muted-foreground mt-1">
                    {formatRussianCurrency(price)} / {getUnitLabel(product.unit)}
                </p>

                {/* Quantity controls */}
                <div className="flex items-center gap-2 mt-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleDecrement}
                        disabled={quantity <= purchaseStep}
                    >
                        <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-16 text-center text-sm font-medium">
                        {formatQuantity(quantity, product.unit)}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleIncrement}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={handleRemove}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Price */}
            <div className="text-right">
                <p className="font-bold text-primary">
                    {formatRussianCurrency(totalPrice)}
                </p>
            </div>
        </div>
    )
}

// Skeleton for loading state
export function CartItemSkeleton() {
    return (
        <div className="flex gap-4 py-4">
            <div className="w-20 h-20 rounded-md bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
                <div className="h-8 bg-muted animate-pulse rounded w-1/2" />
            </div>
            <div className="w-20">
                <div className="h-5 bg-muted animate-pulse rounded" />
            </div>
        </div>
    )
}
