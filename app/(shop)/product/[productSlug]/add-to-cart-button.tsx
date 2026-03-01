"use client"

import { useState } from "react"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QuantitySelector } from "@/components/shop/quantity-selector"
import { useCart } from "@/hooks/use-cart"
import { getUnitLabel } from "@/lib/utils/format"

interface AddToCartButtonProps {
    productId: string
    minQuantity: number
    stepQuantity: number
    unit: string
    isOutOfStock: boolean
}

export function AddToCartButton({
    productId,
    minQuantity,
    stepQuantity,
    unit,
    isOutOfStock,
}: AddToCartButtonProps) {
    const [quantity, setQuantity] = useState(minQuantity)
    const { addItem, isLoading } = useCart()
    const [isAdded, setIsAdded] = useState(false)

    const handleAddToCart = async () => {
        await addItem(productId, quantity)
        setIsAdded(true)
        setTimeout(() => setIsAdded(false), 2000)
    }

    const unitLabel = unit === "KG" ? "кг" : "шт"

    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <QuantitySelector
                value={quantity}
                min={minQuantity}
                step={stepQuantity}
                unit={unitLabel}
                onChange={setQuantity}
                disabled={isOutOfStock}
            />
            <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={isOutOfStock || isLoading}
                className="flex-1"
            >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {isAdded
                    ? "Добавлено!"
                    : isOutOfStock
                        ? "Нет в наличии"
                        : "Добавить в корзину"}
            </Button>
        </div>
    )
}
