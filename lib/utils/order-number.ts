import { prisma } from "@/lib/prisma"

/**
 * Generate a unique order number in format: ORD-YYYY-NNNNNN
 * e.g., ORD-2026-000001
 */
export async function generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `ORD-${year}-`

    // Get the count of orders for this year to determine sequence
    const lastOrder = await prisma.order.findFirst({
        where: {
            orderNumber: {
                startsWith: prefix,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            orderNumber: true,
        },
    })

    let sequence = 1

    if (lastOrder) {
        // Extract sequence number from last order
        const lastSequence = parseInt(lastOrder.orderNumber.replace(prefix, ""), 10)
        if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1
        }
    }

    // Pad sequence to 6 digits
    const paddedSequence = sequence.toString().padStart(6, "0")

    return `${prefix}${paddedSequence}`
}

/**
 * Format order number for display
 */
export function formatOrderNumber(orderNumber: string): string {
    return orderNumber
}

/**
 * Parse order number components
 */
export function parseOrderNumber(orderNumber: string): {
    year: number
    sequence: number
} | null {
    const match = orderNumber.match(/^ORD-(\d{4})-(\d+)$/)
    if (!match) return null

    return {
        year: parseInt(match[1], 10),
        sequence: parseInt(match[2], 10),
    }
}
