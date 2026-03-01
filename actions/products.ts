"use server"

import { prisma } from "@/lib/prisma"

interface GetProductsParams {
    categorySlug?: string
    search?: string
    isHit?: boolean
    isNew?: boolean
    inStock?: boolean
    sortBy?: "name" | "price" | "createdAt"
    sortOrder?: "asc" | "desc"
    page?: number
    limit?: number
}

export async function getProducts(params: GetProductsParams = {}) {
    const {
        categorySlug,
        search,
        isHit,
        isNew,
        inStock,
        sortBy = "createdAt",
        sortOrder = "desc",
        page = 1,
        limit = 20,
    } = params

    try {
        const where: any = { isActive: true }

        // Category filter
        if (categorySlug) {
            const category = await prisma.category.findUnique({
                where: { slug: categorySlug },
            })
            if (category) {
                where.categoryId = category.id
            }
        }

        // Search
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ]
        }

        // Flags
        if (isHit !== undefined) {
            where.isHit = isHit
        }
        if (isNew !== undefined) {
            where.isNew = isNew
        }
        if (inStock) {
            where.stockQuantity = { gt: 0 }
        }

        // Sorting
        const orderBy: any = {}
        if (sortBy === "price") {
            orderBy.retailPrice = sortOrder
        } else {
            orderBy[sortBy] = sortOrder
        }

        // Get total count
        const total = await prisma.product.count({ where })

        // Get products
        const products = await prisma.product.findMany({
            where,
            include: {
                category: {
                    select: { id: true, name: true, slug: true },
                },
                images: {
                    where: { isPrimary: true },
                    take: 1,
                },
            },
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
        })

        return {
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    } catch (error) {
        console.error("Get products error:", error)
        return {
            products: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        }
    }
}

export async function getProductBySlug(slug: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { slug },
            include: {
                category: true,
                images: {
                    orderBy: { displayOrder: "asc" },
                },
            },
        })

        return product
    } catch (error) {
        console.error("Get product error:", error)
        return null
    }
}

export async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: "asc" },
            include: {
                _count: {
                    select: {
                        products: {
                            where: { isActive: true },
                        },
                    },
                },
            },
        })

        return categories
    } catch (error) {
        console.error("Get categories error:", error)
        return []
    }
}

export async function getHitProducts(limit: number = 8) {
    try {
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                isHit: true,
            },
            include: {
                images: {
                    where: { isPrimary: true },
                    take: 1,
                },
            },
            take: limit,
            orderBy: { createdAt: "desc" },
        })

        return products
    } catch (error) {
        console.error("Get hit products error:", error)
        return []
    }
}

export async function getNewProducts(limit: number = 8) {
    try {
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                isNew: true,
            },
            include: {
                images: {
                    where: { isPrimary: true },
                    take: 1,
                },
            },
            take: limit,
            orderBy: { createdAt: "desc" },
        })

        return products
    } catch (error) {
        console.error("Get new products error:", error)
        return []
    }
}
