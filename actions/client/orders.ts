"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export type OrdersFilter = {
    status?: "active" | "completed" | "cancelled"
    search?: string
    dateFrom?: string
    dateTo?: string
}

export async function getClientOrders(filter?: OrdersFilter) {
    const session = await auth()

    if (!session?.user) {
        return []
    }

    try {
        const where: Record<string, unknown> = {
            userId: session.user.id,
        }

        // Status filter
        if (filter?.status === "active") {
            where.status = { in: ["PENDING", "CONFIRMED", "PREPARING", "DELIVERING"] }
        } else if (filter?.status === "completed") {
            where.status = "DELIVERED"
        } else if (filter?.status === "cancelled") {
            where.status = "CANCELLED"
        }

        // Search by order number
        if (filter?.search) {
            where.orderNumber = { contains: filter.search, mode: "insensitive" }
        }

        // Date range filter
        if (filter?.dateFrom || filter?.dateTo) {
            where.createdAt = {}
            if (filter?.dateFrom) {
                (where.createdAt as Record<string, unknown>).gte = new Date(filter.dateFrom)
            }
            if (filter?.dateTo) {
                (where.createdAt as Record<string, unknown>).lte = new Date(filter.dateTo + "T23:59:59.999Z")
            }
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: {
                    select: {
                        id: true,
                        productName: true,
                        quantity: true,
                        unit: true,
                        unitPrice: true,
                        totalPrice: true,
                    },
                },
                _count: {
                    select: { items: true },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        return orders
    } catch (error) {
        console.error("Get client orders error:", error)
        return []
    }
}

export async function getClientOrderById(orderId: string) {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    try {
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: session.user.id, // IDOR prevention
            },
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
                address: true,
                statusHistory: {
                    orderBy: { createdAt: "asc" },
                },
            },
        })

        return order
    } catch (error) {
        console.error("Get client order error:", error)
        return null
    }
}

/**
 * Reorder: get items from a past order and check availability.
 * Returns items with current availability status.
 */
export async function getReorderItems(orderId: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "Необходима авторизация" }
    }

    try {
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: session.user.id, // IDOR prevention
            },
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

        if (!order) {
            return { error: "Заказ не найден" }
        }

        // Map items with availability check
        const items = order.items.map((item) => {
            const product = item.product
            const isAvailable = product.isActive && Number(product.stockQuantity) > 0
            const priceChanged = Number(product.wholesalePrice) !== Number(item.unitPrice)

            return {
                productId: product.id,
                productName: item.productName,
                quantity: Number(item.quantity),
                unit: item.unit,
                originalPrice: Number(item.unitPrice),
                currentPrice: Number(product.wholesalePrice),
                isAvailable,
                priceChanged,
                image: product.images[0]?.url || null,
            }
        })

        return { success: true, items }
    } catch (error) {
        console.error("Get reorder items error:", error)
        return { error: "Ошибка при подготовке повторного заказа" }
    }
}
