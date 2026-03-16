"use client"

import { useRouter } from "next/navigation"
import { CartItem } from "@/components/shop/cart-item"
import { useCart } from "@/hooks/use-cart"

export function CartItemsList() {
    const router = useRouter()
    const { items, updateQuantity, removeItem } = useCart()

    const handleUpdateQuantity = async (itemId: string, quantity: number) => {
        await updateQuantity(itemId, quantity)
        router.refresh()
    }

    const handleRemove = async (itemId: string) => {
        await removeItem(itemId)
        router.refresh()
    }

    return (
        <div className="divide-y">
            {items.map((item) => (
                <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemove}
                />
            ))}
        </div>
    )
}
