"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const GUEST_CART_COOKIE = "guest_cart_id"
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

async function getOrCreateGuestCartId(): Promise<string> {
    const cookieStore = await cookies()
    let guestCartId = cookieStore.get(GUEST_CART_COOKIE)?.value

    if (!guestCartId) {
        guestCartId = crypto.randomUUID()
        cookieStore.set(GUEST_CART_COOKIE, guestCartId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: CART_COOKIE_MAX_AGE,
        })
    }

    return guestCartId
}

async function getCartForUser() {
    const session = await auth()

    if (session?.user) {
        // Logged in user - get or create user cart
        let cart = await prisma.cart.findUnique({
            where: { userId: session.user.id },
        })

        if (!cart) {
            // Check if there's a guest cart to merge
            const cookieStore = await cookies()
            const guestCartId = cookieStore.get(GUEST_CART_COOKIE)?.value

            if (guestCartId) {
                const guestCart = await prisma.cart.findUnique({
                    where: { sessionId: guestCartId },
                    include: { items: true },
                })

                if (guestCart && guestCart.items.length > 0) {
                    // Create user cart with guest cart items
                    cart = await prisma.cart.create({
                        data: {
                            userId: session.user.id,
                            items: {
                                create: guestCart.items.map((item) => ({
                                    productId: item.productId,
                                    quantity: item.quantity,
                                    priceSnapshot: item.priceSnapshot,
                                })),
                            },
                        },
                    })

                    // Delete the guest cart
                    await prisma.cart.delete({
                        where: { id: guestCart.id },
                    })

                    // Clear the guest cart cookie
                    cookieStore.delete(GUEST_CART_COOKIE)
                } else {
                    cart = await prisma.cart.create({
                        data: { userId: session.user.id },
                    })
                }
            } else {
                cart = await prisma.cart.create({
                    data: { userId: session.user.id },
                })
            }
        }

        return { cart, isWholesale: session.user.isWholesale }
    } else {
        // Guest user - get or create guest cart
        const guestCartId = await getOrCreateGuestCartId()

        let cart = await prisma.cart.findUnique({
            where: { sessionId: guestCartId },
        })

        if (!cart) {
            cart = await prisma.cart.create({
                data: { sessionId: guestCartId },
            })
        }

        return { cart, isWholesale: false }
    }
}

export async function addToCart(productId: string, quantity: number) {
    try {
        const { cart, isWholesale } = await getCartForUser()

        // Get product
        const product = await prisma.product.findUnique({
            where: { id: productId },
        })

        if (!product || !product.isActive) {
            return { error: "Товар не найден" }
        }

        // Check if item already in cart
        const existingItem = await prisma.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId,
                },
            },
        })

        const price = isWholesale
            ? product.wholesalePrice
            : product.retailPrice

        if (existingItem) {
            // Update quantity
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: {
                    quantity: {
                        increment: quantity,
                    },
                    priceSnapshot: price,
                },
            })
        } else {
            // Create new item
            await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity,
                    priceSnapshot: price,
                },
            })
        }

        revalidatePath("/")
        revalidatePath("/cart")

        return { success: true }
    } catch (error) {
        console.error("Add to cart error:", error)
        return { error: "Ошибка при добавлении в корзину" }
    }
}

export async function updateCartItemQuantity(
    cartItemId: string,
    quantity: number
) {
    try {
        const { cart } = await getCartForUser()

        // Verify item belongs to cart
        const item = await prisma.cartItem.findFirst({
            where: {
                id: cartItemId,
                cartId: cart.id,
            },
            include: { product: true },
        })

        if (!item) {
            return { error: "Товар не найден в корзине" }
        }

        // Validate quantity
        if (quantity < Number(item.product.minOrderQuantity)) {
            return { error: "Минимальное количество не достигнуто" }
        }

        await prisma.cartItem.update({
            where: { id: cartItemId },
            data: { quantity },
        })

        revalidatePath("/cart")

        return { success: true }
    } catch (error) {
        console.error("Update cart error:", error)
        return { error: "Ошибка при обновлении корзины" }
    }
}

export async function removeFromCart(cartItemId: string) {
    try {
        const { cart } = await getCartForUser()

        // Verify item belongs to cart
        const item = await prisma.cartItem.findFirst({
            where: {
                id: cartItemId,
                cartId: cart.id,
            },
        })

        if (!item) {
            return { error: "Товар не найден в корзине" }
        }

        await prisma.cartItem.delete({
            where: { id: cartItemId },
        })

        revalidatePath("/cart")

        return { success: true }
    } catch (error) {
        console.error("Remove from cart error:", error)
        return { error: "Ошибка при удалении из корзины" }
    }
}

export async function clearCart() {
    try {
        const { cart } = await getCartForUser()

        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
        })

        revalidatePath("/cart")

        return { success: true }
    } catch (error) {
        console.error("Clear cart error:", error)
        return { error: "Ошибка при очистке корзины" }
    }
}

export async function getCart() {
    try {
        const session = await auth()

        if (session?.user) {
            // Get user cart
            const cart = await prisma.cart.findUnique({
                where: { userId: session.user.id },
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    images: {
                                        where: { isPrimary: true },
                                        take: 1,
                                    },
                                },
                            },
                        },
                    },
                },
            })

            return cart
        } else {
            // Get guest cart
            const cookieStore = await cookies()
            const guestCartId = cookieStore.get(GUEST_CART_COOKIE)?.value

            if (!guestCartId) {
                return null
            }

            const cart = await prisma.cart.findUnique({
                where: { sessionId: guestCartId },
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    images: {
                                        where: { isPrimary: true },
                                        take: 1,
                                    },
                                },
                            },
                        },
                    },
                },
            })

            return cart
        }
    } catch (error) {
        console.error("Get cart error:", error)
        return null
    }
}

// For use in layout to get initial cart items
export async function getGuestCart() {
    try {
        const session = await auth()

        if (session?.user) {
            const cart = await prisma.cart.findUnique({
                where: { userId: session.user.id },
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    images: {
                                        where: { isPrimary: true },
                                        take: 1,
                                    },
                                },
                            },
                        },
                    },
                },
            })

            if (!cart) return { items: [] }

            return {
                items: cart.items.map((item) => ({
                    id: item.id,
                    quantity: Number(item.quantity),
                    product: {
                        id: item.product.id,
                        name: item.product.name,
                        slug: item.product.slug,
                        retailPrice: Number(item.product.retailPrice),
                        wholesalePrice: Number(item.product.wholesalePrice),
                        unit: item.product.unit,
                        stepQuantity: Number(item.product.stepQuantity),
                        minOrderQuantity: Number(item.product.minOrderQuantity),
                        images: item.product.images.map((img) => ({
                            url: img.url,
                            alt: img.alt,
                        })),
                    },
                })),
            }
        }

        const cookieStore = await cookies()
        const guestCartId = cookieStore.get(GUEST_CART_COOKIE)?.value

        if (!guestCartId) {
            return { items: [] }
        }

        const cart = await prisma.cart.findUnique({
            where: { sessionId: guestCartId },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                images: {
                                    where: { isPrimary: true },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
            },
        })

        if (!cart) return { items: [] }

        return {
            items: cart.items.map((item) => ({
                id: item.id,
                quantity: Number(item.quantity),
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    slug: item.product.slug,
                    retailPrice: Number(item.product.retailPrice),
                    wholesalePrice: Number(item.product.wholesalePrice),
                    unit: item.product.unit,
                    stepQuantity: Number(item.product.stepQuantity),
                    minOrderQuantity: Number(item.product.minOrderQuantity),
                    images: item.product.images.map((img) => ({
                        url: img.url,
                        alt: img.alt,
                    })),
                },
            })),
        }
    } catch (error) {
        console.error("Get guest cart error:", error)
        return { items: [] }
    }
}

// Merge guest cart with user cart on login
export async function mergeGuestCart() {
    const session = await auth()

    if (!session?.user) {
        return
    }

    try {
        const cookieStore = await cookies()
        const guestCartId = cookieStore.get(GUEST_CART_COOKIE)?.value

        if (!guestCartId) {
            return
        }

        const guestCart = await prisma.cart.findUnique({
            where: { sessionId: guestCartId },
            include: { items: true },
        })

        if (!guestCart || guestCart.items.length === 0) {
            return
        }

        // Get or create user cart
        let userCart = await prisma.cart.findUnique({
            where: { userId: session.user.id },
            include: { items: true },
        })

        if (!userCart) {
            userCart = await prisma.cart.create({
                data: { userId: session.user.id },
                include: { items: true },
            })
        }

        // Merge items
        for (const guestItem of guestCart.items) {
            const existingItem = userCart.items.find(
                (item) => item.productId === guestItem.productId
            )

            if (existingItem) {
                // Add quantities
                await prisma.cartItem.update({
                    where: { id: existingItem.id },
                    data: {
                        quantity: {
                            increment: guestItem.quantity,
                        },
                    },
                })
            } else {
                // Create new item
                await prisma.cartItem.create({
                    data: {
                        cartId: userCart.id,
                        productId: guestItem.productId,
                        quantity: guestItem.quantity,
                        priceSnapshot: guestItem.priceSnapshot,
                    },
                })
            }
        }

        // Delete guest cart
        await prisma.cart.delete({
            where: { id: guestCart.id },
        })

        // Clear cookie
        cookieStore.delete(GUEST_CART_COOKIE)

        revalidatePath("/cart")
    } catch (error) {
        console.error("Merge guest cart error:", error)
    }
}
