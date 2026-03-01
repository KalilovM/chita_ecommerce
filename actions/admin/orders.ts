"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function updateOrderStatus(
    orderId: string,
    status: string,
    note?: string
) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return { error: "Нет доступа" }
    }

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        })

        if (!order) {
            return { error: "Заказ не найден" }
        }

        // Update order status
        const updateData: any = {
            status: status as any,
        }

        // Set timestamps based on status
        if (status === "CONFIRMED" && !order.confirmedAt) {
            updateData.confirmedAt = new Date()
        }
        if (status === "DELIVERED" && !order.deliveredAt) {
            updateData.deliveredAt = new Date()
            updateData.paymentStatus = "PAID" // Mark as paid when delivered
        }

        await prisma.order.update({
            where: { id: orderId },
            data: updateData,
        })

        // Add to status history
        await prisma.orderStatusHistory.create({
            data: {
                orderId,
                status: status as any,
                note: note || null,
                changedBy: session.user.id,
            },
        })

        revalidatePath("/admin/orders")
        revalidatePath(`/admin/orders/${orderId}`)

        return { success: true }
    } catch (error) {
        console.error("Update order status error:", error)
        return { error: "Ошибка при обновлении статуса заказа" }
    }
}

export async function updatePaymentStatus(orderId: string, paymentStatus: string) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return { error: "Нет доступа" }
    }

    try {
        await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: paymentStatus as any,
            },
        })

        revalidatePath("/admin/orders")
        revalidatePath(`/admin/orders/${orderId}`)

        return { success: true }
    } catch (error) {
        console.error("Update payment status error:", error)
        return { error: "Ошибка при обновлении статуса оплаты" }
    }
}
