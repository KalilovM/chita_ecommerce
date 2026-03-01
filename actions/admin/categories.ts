"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

interface CategoryData {
    name: string
    slug: string
    description: string
    imageUrl: string
    displayOrder: number
    isActive: boolean
    parentId: string | null
}

export async function createCategory(data: CategoryData) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return { error: "Нет доступа" }
    }

    try {
        // Check if slug already exists
        const existing = await prisma.category.findUnique({
            where: { slug: data.slug },
        })

        if (existing) {
            return { error: "Категория с таким slug уже существует" }
        }

        await prisma.category.create({
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description || null,
                imageUrl: data.imageUrl || null,
                displayOrder: data.displayOrder,
                isActive: data.isActive,
                parentId: data.parentId,
            },
        })

        revalidatePath("/admin/categories")
        revalidatePath("/catalog")
        revalidatePath("/")

        return { success: true }
    } catch (error) {
        console.error("Create category error:", error)
        return { error: "Ошибка при создании категории" }
    }
}

export async function updateCategory(id: string, data: CategoryData) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return { error: "Нет доступа" }
    }

    try {
        // Check if slug already exists for another category
        const existing = await prisma.category.findFirst({
            where: {
                slug: data.slug,
                id: { not: id },
            },
        })

        if (existing) {
            return { error: "Категория с таким slug уже существует" }
        }

        await prisma.category.update({
            where: { id },
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description || null,
                imageUrl: data.imageUrl || null,
                displayOrder: data.displayOrder,
                isActive: data.isActive,
                parentId: data.parentId,
            },
        })

        revalidatePath("/admin/categories")
        revalidatePath("/catalog")
        revalidatePath("/")

        return { success: true }
    } catch (error) {
        console.error("Update category error:", error)
        return { error: "Ошибка при обновлении категории" }
    }
}

export async function deleteCategory(id: string) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return { error: "Нет доступа" }
    }

    try {
        // Check if category has products
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: { select: { products: true } },
            },
        })

        if (!category) {
            return { error: "Категория не найдена" }
        }

        if (category._count.products > 0) {
            return { error: "Нельзя удалить категорию с товарами" }
        }

        // Check if category has children
        const children = await prisma.category.count({
            where: { parentId: id },
        })

        if (children > 0) {
            return { error: "Нельзя удалить категорию с подкатегориями" }
        }

        await prisma.category.delete({
            where: { id },
        })

        revalidatePath("/admin/categories")
        revalidatePath("/catalog")
        revalidatePath("/")

        return { success: true }
    } catch (error) {
        console.error("Delete category error:", error)
        return { error: "Ошибка при удалении категории" }
    }
}

export async function updateCategoryOrder(id: string, direction: "up" | "down") {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return { error: "Нет доступа" }
    }

    try {
        const category = await prisma.category.findUnique({
            where: { id },
        })

        if (!category) {
            return { error: "Категория не найдена" }
        }

        const newOrder = direction === "up"
            ? category.displayOrder - 1
            : category.displayOrder + 1

        await prisma.category.update({
            where: { id },
            data: { displayOrder: newOrder },
        })

        revalidatePath("/admin/categories")
        revalidatePath("/catalog")
        revalidatePath("/")

        return { success: true }
    } catch (error) {
        console.error("Update category order error:", error)
        return { error: "Ошибка при изменении порядка" }
    }
}

export async function toggleCategoryStatus(id: string) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return { error: "Нет доступа" }
    }

    try {
        const category = await prisma.category.findUnique({
            where: { id },
        })

        if (!category) {
            return { error: "Категория не найдена" }
        }

        await prisma.category.update({
            where: { id },
            data: { isActive: !category.isActive },
        })

        revalidatePath("/admin/categories")
        revalidatePath("/catalog")
        revalidatePath("/")

        return { success: true }
    } catch (error) {
        console.error("Toggle category status error:", error)
        return { error: "Ошибка при изменении статуса" }
    }
}
