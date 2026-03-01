"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { CreateSavedListSchema, UpdateSavedListSchema } from "@/lib/validators/saved-list"
import type { SavedListType } from "@prisma/client"

export async function getSavedLists() {
    const session = await auth()

    if (!session?.user) {
        return []
    }

    try {
        const lists = await prisma.savedList.findMany({
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
                _count: {
                    select: { items: true },
                },
            },
            orderBy: { updatedAt: "desc" },
        })

        return lists
    } catch (error) {
        console.error("Get saved lists error:", error)
        return []
    }
}

export async function getSavedListById(listId: string) {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    try {
        const list = await prisma.savedList.findFirst({
            where: {
                id: listId,
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
                                category: {
                                    select: { name: true },
                                },
                            },
                        },
                    },
                },
            },
        })

        return list
    } catch (error) {
        console.error("Get saved list error:", error)
        return null
    }
}

export async function createSavedList(data: { name: string; type: string }) {
    const session = await auth()

    if (!session?.user) {
        return { error: "Необходима авторизация" }
    }

    const validation = CreateSavedListSchema.safeParse(data)
    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    try {
        // For FAVORITES type, only allow one list
        if (validation.data.type === "FAVORITES") {
            const existing = await prisma.savedList.findFirst({
                where: {
                    userId: session.user.id,
                    type: "FAVORITES",
                },
            })
            if (existing) {
                return { error: "Список избранного уже существует", listId: existing.id }
            }
        }

        const list = await prisma.savedList.create({
            data: {
                userId: session.user.id,
                name: validation.data.name,
                type: validation.data.type as SavedListType,
            },
        })

        revalidatePath("/client/lists")

        return { success: true, listId: list.id }
    } catch (error) {
        console.error("Create saved list error:", error)
        return { error: "Ошибка при создании списка" }
    }
}

export async function updateSavedList(listId: string, data: { name: string }) {
    const session = await auth()

    if (!session?.user) {
        return { error: "Необходима авторизация" }
    }

    const validation = UpdateSavedListSchema.safeParse(data)
    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    try {
        // Verify ownership (IDOR prevention)
        const list = await prisma.savedList.findFirst({
            where: { id: listId, userId: session.user.id },
        })

        if (!list) {
            return { error: "Список не найден" }
        }

        await prisma.savedList.update({
            where: { id: listId },
            data: { name: validation.data.name },
        })

        revalidatePath("/client/lists")
        revalidatePath(`/client/lists/${listId}`)

        return { success: true }
    } catch (error) {
        console.error("Update saved list error:", error)
        return { error: "Ошибка при обновлении списка" }
    }
}

export async function deleteSavedList(listId: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "Необходима авторизация" }
    }

    try {
        // Verify ownership (IDOR prevention)
        const list = await prisma.savedList.findFirst({
            where: { id: listId, userId: session.user.id },
        })

        if (!list) {
            return { error: "Список не найден" }
        }

        await prisma.savedList.delete({
            where: { id: listId },
        })

        revalidatePath("/client/lists")

        return { success: true }
    } catch (error) {
        console.error("Delete saved list error:", error)
        return { error: "Ошибка при удалении списка" }
    }
}

export async function addItemToList(listId: string, productId: string, quantity: number = 1) {
    const session = await auth()

    if (!session?.user) {
        return { error: "Необходима авторизация" }
    }

    try {
        // Verify ownership (IDOR prevention)
        const list = await prisma.savedList.findFirst({
            where: { id: listId, userId: session.user.id },
        })

        if (!list) {
            return { error: "Список не найден" }
        }

        // Upsert item
        await prisma.savedListItem.upsert({
            where: {
                listId_productId: { listId, productId },
            },
            update: { quantity },
            create: {
                listId,
                productId,
                quantity,
            },
        })

        revalidatePath(`/client/lists/${listId}`)
        revalidatePath("/client/lists")

        return { success: true }
    } catch (error) {
        console.error("Add item to list error:", error)
        return { error: "Ошибка при добавлении товара" }
    }
}

export async function removeItemFromList(listId: string, itemId: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "Необходима авторизация" }
    }

    try {
        // Verify ownership via the list (IDOR prevention)
        const item = await prisma.savedListItem.findFirst({
            where: {
                id: itemId,
                list: {
                    id: listId,
                    userId: session.user.id,
                },
            },
        })

        if (!item) {
            return { error: "Товар не найден" }
        }

        await prisma.savedListItem.delete({
            where: { id: itemId },
        })

        revalidatePath(`/client/lists/${listId}`)
        revalidatePath("/client/lists")

        return { success: true }
    } catch (error) {
        console.error("Remove item from list error:", error)
        return { error: "Ошибка при удалении товара" }
    }
}
