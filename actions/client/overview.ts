"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function getClientOverview() {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    const userId = session.user.id

    try {
        const [
            wholesaleProfile,
            activeOrdersCount,
            openClaimsCount,
            savedListsCount,
            defaultAddress,
            lastOrder,
        ] = await Promise.all([
            prisma.wholesaleProfile.findUnique({
                where: { userId },
            }),
            prisma.order.count({
                where: {
                    userId,
                    status: { in: ["PENDING", "CONFIRMED", "PREPARING", "DELIVERING"] },
                },
            }),
            prisma.claim.count({
                where: {
                    userId,
                    status: { in: ["SUBMITTED", "REVIEWING"] },
                },
            }),
            prisma.savedList.count({
                where: { userId },
            }),
            prisma.address.findFirst({
                where: { userId, isDefault: true },
            }),
            prisma.order.findFirst({
                where: { userId },
                orderBy: { createdAt: "desc" },
                select: { id: true, orderNumber: true, createdAt: true },
            }),
        ])

        return {
            user: {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                role: session.user.role,
                isWholesale: session.user.isWholesale,
            },
            wholesaleProfile,
            stats: {
                activeOrdersCount,
                openClaimsCount,
                savedListsCount,
            },
            defaultAddress,
            lastOrder,
        }
    } catch (error) {
        console.error("Get client overview error:", error)
        return null
    }
}
