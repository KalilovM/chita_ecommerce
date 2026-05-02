"use client"

import { useEffect, useState } from "react"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QuantitySelector } from "@/components/shop/quantity-selector"
import { useCart } from "@/hooks/use-cart"
import { getUnitLabel } from "@/lib/utils/format"
import { resolvePurchaseStep } from "@/lib/utils/purchase-step"

interface AddToCartButtonProps {
    productId: string
    packagingQuantity: number | null
    unit: string
}

export function AddToCartButton({
    productId,
    packagingQuantity,
    unit,
}: AddToCartButtonProps) {
    const purchaseStep = resolvePurchaseStep(packagingQuantity)
    const [quantity, setQuantity] = useState(purchaseStep)
    const { addItem, isLoading } = useCart()
    const [isAdded, setIsAdded] = useState(false)

    useEffect(() => {
        setQuantity(purchaseStep)
    }, [purchaseStep])

    const handleAddToCart = async () => {
        await addItem(productId, quantity)
        setIsAdded(true)
        setTimeout(() => setIsAdded(false), 2000)
    }

    const unitLabel = getUnitLabel(unit, purchaseStep)

    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <QuantitySelector
                value={quantity}
                min={purchaseStep}
                step={purchaseStep}
                unit={unitLabel}
                onChange={setQuantity}
            />
            <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={isLoading}
                className="flex-1"
            >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {isAdded ? "Добавлено!" : "Добавить в корзину"}
            </Button>
        </div>
    )
}
