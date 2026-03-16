"use client"

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode,
} from "react"

interface CartItem {
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
        images?: { url: string; alt?: string | null }[]
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
const CART_STORAGE_KEY = "chita_cart_items"

export function CartProvider({
    children,
    initialItems = [],
}: {
    children: ReactNode
    initialItems?: CartItem[]
}) {
    const [items, setItems] = useState<CartItem[]>(initialItems)
    const [pendingRequests, setPendingRequests] = useState(0)

    useEffect(() => {
        if (typeof window === "undefined") {
            return
        }

        const storedItems = window.localStorage.getItem(CART_STORAGE_KEY)
        if (!storedItems || initialItems.length > 0) {
            return
        }

        try {
            const parsedItems = JSON.parse(storedItems) as CartItem[]
            if (parsedItems.length > 0) {
                setItems(parsedItems)
            }
        } catch (error) {
            console.error("Failed to restore cart from localStorage:", error)
        }
    }, [initialItems.length])

    useEffect(() => {
        if (typeof window === "undefined") {
            return
        }

        if (items.length === 0) {
            window.localStorage.removeItem(CART_STORAGE_KEY)
            return
        }

        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }, [items])

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const isLoading = pendingRequests > 0

    const runWithLoading = useCallback(async (operation: () => Promise<void>) => {
        setPendingRequests((count) => count + 1)

        try {
            await operation()
        } finally {
            setPendingRequests((count) => Math.max(0, count - 1))
        }
    }, [])

    const fetchLatestCart = useCallback(async () => {
        try {
            const response = await fetch("/api/cart")

            if (!response.ok) {
                return
            }

            const data = await response.json()
            setItems(data.items ?? [])
        } catch (error) {
            console.error("Failed to refresh cart:", error)
        }
    }, [])

    const addItem = useCallback(async (productId: string, quantity: number) => {
        await runWithLoading(async () => {
            try {
                const response = await fetch("/api/cart/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId, quantity }),
                })

                const data = await response.json().catch(() => null)

                if (response.ok) {
                    setItems(data?.items ?? [])
                    return
                }
            } catch (error) {
                console.error("Failed to add item to cart:", error)
            }

            await fetchLatestCart()
        })
    }, [fetchLatestCart, runWithLoading])

    const updateQuantity = useCallback(
        async (itemId: string, quantity: number) => {
            // Optimistic update
            setItems((prev) =>
                prev.map((item) =>
                    item.id === itemId ? { ...item, quantity } : item
                )
            )

            await runWithLoading(async () => {
                try {
                    const response = await fetch("/api/cart/update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ itemId, quantity }),
                    })

                    const data = await response.json().catch(() => null)

                    if (response.ok) {
                        setItems(data?.items ?? [])
                        return
                    }
                } catch (error) {
                    console.error("Failed to update cart item:", error)
                }

                await fetchLatestCart()
            })
        },
        [fetchLatestCart, runWithLoading]
    )

    const removeItem = useCallback(async (itemId: string) => {
        // Optimistic update
        setItems((prev) => prev.filter((item) => item.id !== itemId))

        await runWithLoading(async () => {
            try {
                const response = await fetch("/api/cart/remove", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ itemId }),
                })

                const data = await response.json().catch(() => null)

                if (response.ok) {
                    setItems(data?.items ?? [])
                    return
                }
            } catch (error) {
                console.error("Failed to remove cart item:", error)
            }

            await fetchLatestCart()
        })
    }, [fetchLatestCart, runWithLoading])

    const clearCart = useCallback(async () => {
        setItems([])

        await runWithLoading(async () => {
            try {
                const response = await fetch("/api/cart/clear", {
                    method: "POST",
                })

                if (response.ok) {
                    setItems([])
                    return
                }
            } catch (error) {
                console.error("Failed to clear cart:", error)
            }

            await fetchLatestCart()
        })
    }, [fetchLatestCart, runWithLoading])

    const refreshCart = useCallback(async () => {
        await runWithLoading(fetchLatestCart)
    }, [fetchLatestCart, runWithLoading])

    return (
        <CartContext.Provider
            value={{
                items,
                itemCount,
                isLoading,
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
