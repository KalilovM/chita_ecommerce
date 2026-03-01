"use client"

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useTransition,
    ReactNode,
} from "react"

interface CartItem {
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
        images?: { url: string; alt?: string }[]
    }
}

interface CartContextType {
    items: CartItem[]
    itemCount: number
    isLoading: boolean
    addItem: (productId: string, quantity: number) => Promise<void>
    updateQuantity: (itemId: string, quantity: number) => Promise<void>
    removeItem: (itemId: string) => Promise<void>
    clearCart: () => Promise<void>
    refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({
    children,
    initialItems = [],
}: {
    children: ReactNode
    initialItems?: CartItem[]
}) {
    const [items, setItems] = useState<CartItem[]>(initialItems)
    const [isPending, startTransition] = useTransition()

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

    const addItem = useCallback(async (productId: string, quantity: number) => {
        startTransition(async () => {
            try {
                const response = await fetch("/api/cart/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId, quantity }),
                })
                if (response.ok) {
                    const data = await response.json()
                    setItems(data.items)
                }
            } catch (error) {
                console.error("Failed to add item to cart:", error)
            }
        })
    }, [])

    const updateQuantity = useCallback(
        async (itemId: string, quantity: number) => {
            // Optimistic update
            setItems((prev) =>
                prev.map((item) =>
                    item.id === itemId ? { ...item, quantity } : item
                )
            )

            startTransition(async () => {
                try {
                    const response = await fetch("/api/cart/update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ itemId, quantity }),
                    })
                    if (!response.ok) {
                        // Revert on error
                        const data = await response.json()
                        setItems(data.items)
                    }
                } catch (error) {
                    console.error("Failed to update cart item:", error)
                }
            })
        },
        []
    )

    const removeItem = useCallback(async (itemId: string) => {
        // Optimistic update
        setItems((prev) => prev.filter((item) => item.id !== itemId))

        startTransition(async () => {
            try {
                await fetch("/api/cart/remove", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ itemId }),
                })
            } catch (error) {
                console.error("Failed to remove cart item:", error)
            }
        })
    }, [])

    const clearCart = useCallback(async () => {
        setItems([])
        startTransition(async () => {
            try {
                await fetch("/api/cart/clear", { method: "POST" })
            } catch (error) {
                console.error("Failed to clear cart:", error)
            }
        })
    }, [])

    const refreshCart = useCallback(async () => {
        startTransition(async () => {
            try {
                const response = await fetch("/api/cart")
                if (response.ok) {
                    const data = await response.json()
                    setItems(data.items)
                }
            } catch (error) {
                console.error("Failed to refresh cart:", error)
            }
        })
    }, [])

    return (
        <CartContext.Provider
            value={{
                items,
                itemCount,
                isLoading: isPending,
                addItem,
                updateQuantity,
                removeItem,
                clearCart,
                refreshCart,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        // Return default values when outside CartProvider
        return {
            items: [],
            itemCount: 0,
            isLoading: false,
            addItem: async () => { },
            updateQuantity: async () => { },
            removeItem: async () => { },
            clearCart: async () => { },
            refreshCart: async () => { },
        }
    }
    return context
}
