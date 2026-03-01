"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

interface UpdateClientData {
    name: string
    phone: string
    isWholesale: boolean
    personalDiscount: number
    role: string
}

export async function updateClient(clientId: string, data: UpdateClientData) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return { error: "Нет доступа" }
    }

    try {
        await prisma.user.update({
            where: { id: clientId },
            data: {
                name: data.name,
                phone: data.phone || null,
                isWholesale: data.isWholesale,
                personalDiscount: data.personalDiscount,
                role: data.role as "CUSTOMER" | "WHOLESALE" | "ADMIN",
            },
        })

        revalidatePath("/admin/clients")
        revalidatePath("/admin/clients/wholesalers")

        return { success: true }
    } catch (error) {
        console.error("Update client error:", error)
        return { error: "Ошибка при обновлении клиента" }
    }
}

export async function deleteClient(clientId: string) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return { error: "Нет доступа" }
    }

    try {
        // Don't allow deleting yourself
        if (clientId === session.user.id) {
            return { error: "Нельзя удалить свой аккаунт" }
        }

        await prisma.user.delete({
            where: { id: clientId },
        })

        revalidatePath("/admin/clients")
        revalidatePath("/admin/clients/wholesalers")

        return { success: true }
    } catch (error) {
        console.error("Delete client error:", error)
        return { error: "Ошибка при удалении клиента" }
    }
}
