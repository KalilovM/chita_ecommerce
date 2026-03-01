"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

interface ProductImage {
    url: string
    alt: string
    displayOrder: number
    isPrimary: boolean
}

interface ProductData {
    name: string
    slug: string
    description: string
    shortDescription: string
    retailPrice: number
    wholesalePrice: number
    costPrice: number
    unit: string
    minOrderQuantity: number
    stepQuantity: number
    stockQuantity: number
    lowStockThreshold: number
    isActive: boolean
    isHit: boolean
    isNew: boolean
    metaTitle: string
    metaDescription: string
    originCountry: string
    categoryId: string
    images: ProductImage[]
}

export async function createProduct(data: ProductData) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return { error: "Нет доступа" }
    }

    try {
        // Check if slug already exists
        const existing = await prisma.product.findUnique({
            where: { slug: data.slug },
        })

        if (existing) {
            return { error: "Товар с таким slug уже существует" }
        }

        await prisma.product.create({
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description || null,
                shortDescription: data.shortDescription || null,
                retailPrice: data.retailPrice,
                wholesalePrice: data.wholesalePrice,
                costPrice: data.costPrice || null,
                unit: data.unit as "KG" | "PIECE" | "BOX" | "BUNCH",
                minOrderQuantity: data.minOrderQuantity,
                stepQuantity: data.stepQuantity,
                stockQuantity: data.stockQuantity,
                lowStockThreshold: data.lowStockThreshold,
                isActive: data.isActive,
                isHit: data.isHit,
                isNew: data.isNew,
                metaTitle: data.metaTitle || null,
                metaDescription: data.metaDescription || null,
                originCountry: data.originCountry,
                categoryId: data.categoryId,
                images: {
                    create: data.images.map((img) => ({
                        url: img.url,
                        alt: img.alt,
                        displayOrder: img.displayOrder,
                        isPrimary: img.isPrimary,
                    })),
                },
            },
        })

        revalidatePath("/admin/products")
        revalidatePath("/catalog")
        revalidatePath("/")

        return { success: true }
    } catch (error) {
        console.error("Create product error:", error)
        return { error: "Ошибка при создании товара" }
    }
}

export async function updateProduct(id: string, data: ProductData) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return { error: "Нет доступа" }
    }

    try {
        // Check if slug already exists for another product
        const existing = await prisma.product.findFirst({
            where: {
                slug: data.slug,
                id: { not: id },
            },
        })

        if (existing) {
            return { error: "Товар с таким slug уже существует" }
        }

        // Delete existing images
        await prisma.productImage.deleteMany({
            where: { productId: id },
        })

        // Update product with new images
        await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description || null,
                shortDescription: data.shortDescription || null,
                retailPrice: data.retailPrice,
                wholesalePrice: data.wholesalePrice,
                costPrice: data.costPrice || null,
                unit: data.unit as "KG" | "PIECE" | "BOX" | "BUNCH",
                minOrderQuantity: data.minOrderQuantity,
                stepQuantity: data.stepQuantity,
                stockQuantity: data.stockQuantity,
                lowStockThreshold: data.lowStockThreshold,
                isActive: data.isActive,
                isHit: data.isHit,
                isNew: data.isNew,
                metaTitle: data.metaTitle || null,
                metaDescription: data.metaDescription || null,
                originCountry: data.originCountry,
                categoryId: data.categoryId,
                images: {
                    create: data.images.map((img) => ({
                        url: img.url,
                        alt: img.alt,
                        displayOrder: img.displayOrder,
                        isPrimary: img.isPrimary,
                    })),
                },
            },
        })

        revalidatePath("/admin/products")
        revalidatePath("/catalog")
        revalidatePath("/")

        return { success: true }
    } catch (error) {
        console.error("Update product error:", error)
        return { error: "Ошибка при обновлении товара" }
    }
}

export async function deleteProduct(id: string) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return { error: "Нет доступа" }
    }

    try {
        // Check if product is in any orders
        const orderItems = await prisma.orderItem.count({
            where: { productId: id },
        })

        if (orderItems > 0) {
            return { error: "Нельзя удалить товар, который есть в заказах" }
        }

        // Delete cart items first
        await prisma.cartItem.deleteMany({
            where: { productId: id },
        })

        // Delete product (images will be cascade deleted)
        await prisma.product.delete({
            where: { id },
        })

        revalidatePath("/admin/products")
        revalidatePath("/catalog")
        revalidatePath("/")

        return { success: true }
    } catch (error) {
        console.error("Delete product error:", error)
        return { error: "Ошибка при удалении товара" }
    }
}

export async function toggleProductStatus(id: string) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return { error: "Нет доступа" }
    }

    try {
        const product = await prisma.product.findUnique({
            where: { id },
        })

        if (!product) {
            return { error: "Товар не найден" }
        }

        await prisma.product.update({
            where: { id },
            data: { isActive: !product.isActive },
        })

        revalidatePath("/admin/products")
        revalidatePath("/catalog")
        revalidatePath("/")

        return { success: true }
    } catch (error) {
        console.error("Toggle product status error:", error)
        return { error: "Ошибка при изменении статуса" }
    }
}
