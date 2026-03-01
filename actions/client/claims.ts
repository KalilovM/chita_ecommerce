"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { CreateClaimSchema } from "@/lib/validators/claim"
import type { ClaimIssueType, ClaimResolution } from "@prisma/client"

export async function getClaims() {
    const session = await auth()

    if (!session?.user) {
        return []
    }

    try {
        const claims = await prisma.claim.findMany({
            where: { userId: session.user.id },
            include: {
                order: {
                    select: { orderNumber: true },
                },
                items: true,
            },
            orderBy: { createdAt: "desc" },
        })

        return claims
    } catch (error) {
        console.error("Get claims error:", error)
        return []
    }
}

export async function getClaimById(claimId: string) {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    try {
        const claim = await prisma.claim.findFirst({
            where: {
                id: claimId,
                userId: session.user.id, // IDOR prevention
            },
            include: {
                order: {
                    select: { orderNumber: true, createdAt: true },
                },
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

        return claim
    } catch (error) {
        console.error("Get claim error:", error)
        return null
    }
}

export async function createClaim(data: {
    orderId: string
    items: {
        productId: string
        productName: string
        quantity: number
        issueType: string
        description?: string
        photos: string[]
    }[]
    preferredResolution: string
}) {
    const session = await auth()

    if (!session?.user) {
        return { error: "Необходима авторизация" }
    }

    // Validate input
    const validation = CreateClaimSchema.safeParse(data)
    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const validated = validation.data

    try {
        // Verify order belongs to user (IDOR prevention)
        const order = await prisma.order.findFirst({
            where: {
                id: validated.orderId,
                userId: session.user.id,
            },
        })

        if (!order) {
            return { error: "Заказ не найден" }
        }

        // Verify order is in a state that allows claims (delivered)
        if (!["DELIVERED", "DELIVERING"].includes(order.status)) {
            return { error: "Претензию можно подать только по доставленному заказу" }
        }

        // Create claim
        const claim = await prisma.claim.create({
            data: {
                userId: session.user.id,
                orderId: validated.orderId,
                preferredResolution: validated.preferredResolution as ClaimResolution,
                items: {
                    create: validated.items.map((item) => ({
                        productId: item.productId,
                        productName: item.productName,
                        quantity: item.quantity,
                        issueType: item.issueType as ClaimIssueType,
                        description: item.description,
                        photos: item.photos,
                    })),
                },
            },
        })

        revalidatePath("/client/claims")

        return { success: true, claimId: claim.id }
    } catch (error) {
        console.error("Create claim error:", error)
        return { error: "Ошибка при создании претензии" }
    }
}

/**
 * Get orders eligible for claims (delivered orders for the current user)
 */
export async function getClaimableOrders() {
    const session = await auth()

    if (!session?.user) {
        return []
    }

    try {
        const orders = await prisma.order.findMany({
            where: {
                userId: session.user.id,
                status: { in: ["DELIVERED", "DELIVERING"] },
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
            orderBy: { createdAt: "desc" },
        })

        return orders
    } catch (error) {
        console.error("Get claimable orders error:", error)
        return []
    }
}
