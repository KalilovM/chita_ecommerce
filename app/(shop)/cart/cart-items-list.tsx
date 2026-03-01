"use client"

import { CartItem } from "@/components/shop/cart-item"
import { useCart } from "@/hooks/use-cart"

interface CartItemsListProps {
    items: {
        id: string
        quantity: number
        product: {
            id: string
            name: string
            slug: string
            retailPrice: number
            wholesalePrice: number
            unit: string
            stepQuantity: number
            minOrderQuantity: number
            images?: { url: string; alt?: string | null }[]
        }
    }[]
    isWholesale?: boolean
}

export function CartItemsList({ items, isWholesale }: CartItemsListProps) {
    const { updateQuantity, removeItem } = useCart()

    const handleUpdateQuantity = (itemId: string, quantity: number) => {
        updateQuantity(itemId, quantity)
    }

    const handleRemove = (itemId: string) => {
        removeItem(itemId)
    }

    return (
        <div className="divide-y">
            {items.map((item) => (
                <CartItem
                    key={item.id}
                    item={item}
                    isWholesale={isWholesale}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemove}
                />
            ))}
        </div>
    )
}
