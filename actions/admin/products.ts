"use server"

import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
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
    variantGroup: string
    variationName: string
    variationAttributes: string
    price: number
    unit: string
    minOrderQuantity: number
    stepQuantity: number
    packagingType: string
    packagingQuantity: number | null
    packagingUnit: string
    isActive: boolean
    isHit: boolean
    isNew: boolean
    metaTitle: string
    metaDescription: string
    originCountry: string
    categoryId: string
    images: ProductImage[]
}

const PRODUCT_IMAGE_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products")
const PRODUCT_IMAGE_URL_PREFIX = "/uploads/products"
const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024
const PRODUCT_IMAGE_EXTENSIONS: Record<string, string> = {
    "image/avif": "avif",
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}

function parseVariationAttributes(value: string) {
    const normalizedValue = value.trim()
    if (!normalizedValue) {
        return Prisma.DbNull
    }

    const attributes = normalizedValue
        .split("|")
        .map((entry) => {
            const [rawKey, rawValue] = entry.split(/[:=]/, 2)
            const key = rawKey?.trim()
            const attributeValue = rawValue?.trim()

            if (!key || !attributeValue) {
                return null
            }

            return [key, attributeValue] as const
        })
        .filter((attribute): attribute is readonly [string, string] => Boolean(attribute))

    if (attributes.length === 0) {
        return Prisma.DbNull
    }

    return Object.fromEntries(attributes)
}

export async function uploadProductImages(formData: FormData) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return { error: "Нет доступа" }
    }

    const files = formData
        .getAll("images")
        .filter((file): file is File => file instanceof File && file.size > 0)

    if (files.length === 0) {
        return { error: "Выберите изображения для загрузки." }
    }

    for (const file of files) {
        if (!PRODUCT_IMAGE_EXTENSIONS[file.type]) {
            return { error: "Можно загружать только изображения JPG, PNG, WebP, GIF или AVIF." }
        }

        if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
            return { error: "Размер одного изображения не должен превышать 5 МБ." }
        }
    }

    try {
        await mkdir(PRODUCT_IMAGE_UPLOAD_DIR, { recursive: true })

        const uploadedImages: { url: string; alt: string }[] = []

        for (const file of files) {
            const extension = PRODUCT_IMAGE_EXTENSIONS[file.type]
            const fileName = `${Date.now()}-${randomUUID()}.${extension}`
            const filePath = path.join(PRODUCT_IMAGE_UPLOAD_DIR, fileName)

            await writeFile(filePath, Buffer.from(await file.arrayBuffer()))

            uploadedImages.push({
                url: `${PRODUCT_IMAGE_URL_PREFIX}/${fileName}`,
                alt: file.name.replace(/\.[^/.]+$/, ""),
            })
        }

        return { success: true, images: uploadedImages }
    } catch (error) {
        console.error("Upload product images error:", error)
        return { error: "Не удалось загрузить изображения." }
    }
}

export async function createProduct(data: ProductData) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return { error: "Нет доступа" }
    }

    try {
        const existing = await prisma.product.findUnique({
            where: { slug: data.slug },
        })

        if (existing) {
            return { error: "Товар с таким слагом уже существует" }
        }

        await prisma.product.create({
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description || null,
                shortDescription: data.shortDescription || null,
                variantGroup: data.variantGroup.trim() || null,
                variationName: data.variationName.trim() || null,
                variantAttributes: parseVariationAttributes(data.variationAttributes),
                price: data.price,
                unit: data.unit as "KG" | "PIECE" | "BOX" | "BUNCH",
                minOrderQuantity: data.minOrderQuantity,
                stepQuantity: data.stepQuantity,
                packagingType: data.packagingType.trim() || null,
                packagingQuantity: data.packagingQuantity,
                packagingUnit: data.packagingUnit
                    ? data.packagingUnit as "KG" | "PIECE" | "BOX" | "BUNCH"
                    : null,
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
        const existing = await prisma.product.findFirst({
            where: {
                slug: data.slug,
                id: { not: id },
            },
        })

        if (existing) {
            return { error: "Товар с таким слагом уже существует" }
        }

        await prisma.productImage.deleteMany({
            where: { productId: id },
        })

        await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description || null,
                shortDescription: data.shortDescription || null,
                variantGroup: data.variantGroup.trim() || null,
                variationName: data.variationName.trim() || null,
                variantAttributes: parseVariationAttributes(data.variationAttributes),
                price: data.price,
                unit: data.unit as "KG" | "PIECE" | "BOX" | "BUNCH",
                minOrderQuantity: data.minOrderQuantity,
                stepQuantity: data.stepQuantity,
                packagingType: data.packagingType.trim() || null,
                packagingQuantity: data.packagingQuantity,
                packagingUnit: data.packagingUnit
                    ? data.packagingUnit as "KG" | "PIECE" | "BOX" | "BUNCH"
                    : null,
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
        const orderItems = await prisma.orderItem.count({
            where: { productId: id },
        })

        if (orderItems > 0) {
            return { error: "Нельзя удалить товар, который есть в заказах" }
        }

        await prisma.cartItem.deleteMany({
            where: { productId: id },
        })

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
