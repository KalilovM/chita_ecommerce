"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import {
    coerceBulkProductDraftRows,
    decodeCsvBytes,
    getCategorySegments,
    normalizeDraftRow,
    parseBulkProductCsv,
    parseVariationAttributes,
    splitDelimitedValues,
    type BulkProductDraftRow,
} from "@/lib/products/bulk-import"
import { serializeBulkProductDraft } from "@/lib/products/bulk-import-draft"
import { prisma } from "@/lib/prisma"
import { buildProductSlug, slugify } from "@/lib/utils"

async function requireAdminUserId() {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return null
    }

    return session.user.id
}

function toNullableString(value: string) {
    const trimmedValue = value.trim()
    return trimmedValue || null
}

function toDecimal(value: string, fallbackValue: string) {
    return new Prisma.Decimal((value || fallbackValue).replace(",", "."))
}

async function findOwnedDraft(id: string, userId: string) {
    return prisma.bulkProductDraft.findFirst({
        where: {
            id,
            createdById: userId,
        },
    })
}

function normalizeRows(rows: BulkProductDraftRow[]) {
    return rows.map((row, index) => normalizeDraftRow(row, index))
}

async function ensureUniqueCategorySlug(
    tx: Prisma.TransactionClient,
    desiredSlug: string
) {
    const baseSlug = desiredSlug || "category"
    let candidateSlug = baseSlug
    let suffix = 2

    while (true) {
        const existingCategory = await tx.category.findUnique({
            where: { slug: candidateSlug },
            select: { id: true },
        })

        if (!existingCategory) {
            return candidateSlug
        }

        candidateSlug = `${baseSlug}-${suffix}`
        suffix += 1
    }
}

async function ensureUniqueProductSlug(
    tx: Prisma.TransactionClient,
    desiredSlug: string,
    excludedProductId?: string
) {
    const baseSlug = desiredSlug || "product"
    let candidateSlug = baseSlug
    let suffix = 2

    while (true) {
        const existingProduct = await tx.product.findFirst({
            where: {
                slug: candidateSlug,
                ...(excludedProductId
                    ? {
                        id: {
                            not: excludedProductId,
                        },
                    }
                    : {}),
            },
            select: { id: true },
        })

        if (!existingProduct) {
            return candidateSlug
        }

        candidateSlug = `${baseSlug}-${suffix}`
        suffix += 1
    }
}

async function ensureCategoryPath(
    tx: Prisma.TransactionClient,
    categoryPath: string,
    stats: { categoriesCreated: number }
) {
    const categorySegments = getCategorySegments(categoryPath)
    let currentCategory: { id: string; slug: string } | null = null

    for (const categorySegment of categorySegments) {
        const parentCategoryId: string | null = currentCategory ? currentCategory.id : null
        const existingCategory: { id: string; slug: string } | null = await tx.category.findFirst({
            where: {
                parentId: parentCategoryId,
                name: {
                    equals: categorySegment,
                    mode: "insensitive",
                },
            },
            select: {
                id: true,
                slug: true,
            },
        })

        if (existingCategory) {
            currentCategory = existingCategory
            continue
        }

        const desiredSlug = currentCategory
            ? `${currentCategory.slug}-${slugify(categorySegment)}`
            : slugify(categorySegment)

        const slug = await ensureUniqueCategorySlug(tx, desiredSlug)
        currentCategory = await tx.category.create({
            data: {
                name: categorySegment,
                slug,
                parentId: parentCategoryId,
            },
            select: {
                id: true,
                slug: true,
            },
        })

        stats.categoriesCreated += 1
    }

    if (!currentCategory) {
        throw new Error("Category path is empty.")
    }

    return currentCategory
}

async function replaceProductImages(
    tx: Prisma.TransactionClient,
    productId: string,
    imageUrls: string[],
    productName: string
) {
    await tx.productImage.deleteMany({
        where: { productId },
    })

    if (imageUrls.length === 0) {
        return
    }

    await tx.productImage.createMany({
        data: imageUrls.map((url, index) => ({
            productId,
            url,
            alt: productName,
            displayOrder: index,
            isPrimary: index === 0,
        })),
    })
}

export async function createBulkProductDraftFromFile(formData: FormData) {
    const userId = await requireAdminUserId()

    if (!userId) {
        return { error: "Нет доступа" }
    }

    const uploadedFile = formData.get("file")
    if (!(uploadedFile instanceof File)) {
        return { error: "CSV file is required." }
    }

    try {
        const csvContent = decodeCsvBytes(await uploadedFile.arrayBuffer())
        const parsedDraft = parseBulkProductCsv(csvContent, uploadedFile.name)

        if (parsedDraft.rows.length === 0) {
            return { error: "The uploaded CSV file is empty." }
        }

        const createdDraft = await prisma.bulkProductDraft.create({
            data: {
                createdById: userId,
                name: parsedDraft.draftName,
                sourceFileName: uploadedFile.name,
                rows: parsedDraft.rows as unknown as Prisma.InputJsonValue,
                rowCount: parsedDraft.rows.length,
            },
        })

        revalidatePath("/admin/products/new")
        revalidatePath("/admin/products/new/bulk")

        return {
            success: true,
            draft: serializeBulkProductDraft(createdDraft),
        }
    } catch (error) {
        console.error("Create bulk product draft error:", error)
        return { error: "Failed to parse the uploaded CSV file." }
    }
}

export async function saveBulkProductDraft(
    draftId: string,
    payload: {
        name: string
        rows: BulkProductDraftRow[]
    }
) {
    const userId = await requireAdminUserId()

    if (!userId) {
        return { error: "Нет доступа" }
    }

    const existingDraft = await findOwnedDraft(draftId, userId)

    if (!existingDraft) {
        return { error: "Draft not found." }
    }

    try {
        const normalizedRows = normalizeRows(payload.rows)
        const updatedDraft = await prisma.bulkProductDraft.update({
            where: { id: draftId },
            data: {
                name: payload.name.trim() || existingDraft.name,
                rows: normalizedRows as unknown as Prisma.InputJsonValue,
                rowCount: normalizedRows.length,
            },
        })

        return {
            success: true,
            draft: serializeBulkProductDraft(updatedDraft),
        }
    } catch (error) {
        console.error("Save bulk product draft error:", error)
        return { error: "Failed to save the draft." }
    }
}

export async function deleteBulkProductDraft(draftId: string) {
    const userId = await requireAdminUserId()

    if (!userId) {
        return { error: "Нет доступа" }
    }

    const existingDraft = await findOwnedDraft(draftId, userId)

    if (!existingDraft) {
        return { error: "Draft not found." }
    }

    try {
        await prisma.bulkProductDraft.delete({
            where: { id: draftId },
        })

        revalidatePath("/admin/products/new")
        revalidatePath("/admin/products/new/bulk")

        return { success: true }
    } catch (error) {
        console.error("Delete bulk product draft error:", error)
        return { error: "Failed to delete the draft." }
    }
}

export async function importBulkProductDraft(draftId: string) {
    const userId = await requireAdminUserId()

    if (!userId) {
        return { error: "Нет доступа" }
    }

    const existingDraft = await findOwnedDraft(draftId, userId)

    if (!existingDraft) {
        return { error: "Draft not found." }
    }

    const rows = coerceBulkProductDraftRows(existingDraft.rows)
    const rowsWithErrors = new Set(
        serializeBulkProductDraft(existingDraft).issues
            .filter((issue) => issue.severity === "error")
            .map((issue) => issue.rowId)
    )

    if (rowsWithErrors.size > 0) {
        return { error: "Resolve draft errors before importing products." }
    }

    const importStats = {
        created: 0,
        updated: 0,
        categoriesCreated: 0,
    }

    try {
        await prisma.$transaction(async (tx) => {
            for (const row of rows) {
                const category = await ensureCategoryPath(
                    tx,
                    row.categoryPath,
                    importStats
                )

                const imageUrls = splitDelimitedValues(row.imageUrls)
                const existingProduct = row.importKey
                    ? await tx.product.findUnique({
                        where: { importKey: row.importKey },
                        select: {
                            id: true,
                            slug: true,
                            importKey: true,
                            description: true,
                            shortDescription: true,
                            metaTitle: true,
                            metaDescription: true,
                            originCountry: true,
                            packagingType: true,
                            packagingQuantity: true,
                            packagingUnit: true,
                            variantGroup: true,
                            variationName: true,
                            variantAttributes: true,
                        },
                    })
                    : null

                const fallbackProduct = existingProduct
                    ? existingProduct
                    : await tx.product.findUnique({
                        where: { slug: row.slug || buildProductSlug(row.name, row.variationName) },
                        select: {
                            id: true,
                            slug: true,
                            importKey: true,
                            description: true,
                            shortDescription: true,
                            metaTitle: true,
                            metaDescription: true,
                            originCountry: true,
                            packagingType: true,
                            packagingQuantity: true,
                            packagingUnit: true,
                            variantGroup: true,
                            variationName: true,
                            variantAttributes: true,
                        },
                    })

                const productToUpsert = existingProduct ?? fallbackProduct
                const desiredSlug = row.slug || buildProductSlug(row.name, row.variationName)
                const productSlug = await ensureUniqueProductSlug(
                    tx,
                    desiredSlug,
                    productToUpsert?.id
                )

                const productData = {
                    importKey: row.importKey,
                    name: row.name,
                    slug: productSlug,
                    description:
                        row.description.trim() ||
                        productToUpsert?.description ||
                        null,
                    shortDescription:
                        row.shortDescription.trim() ||
                        productToUpsert?.shortDescription ||
                        null,
                    price: toDecimal(row.price, "0"),
                    unit: row.unit,
                    minOrderQuantity: toDecimal(row.minOrderQuantity, "1"),
                    stepQuantity: toDecimal(row.stepQuantity, row.unit === "KG" ? "0.1" : "1"),
                    isActive: row.isActive,
                    isHit: row.isHit,
                    isNew: row.isNew,
                    metaTitle:
                        toNullableString(row.metaTitle) ||
                        productToUpsert?.metaTitle ||
                        null,
                    metaDescription:
                        toNullableString(row.metaDescription) ||
                        productToUpsert?.metaDescription ||
                        null,
                    originCountry:
                        row.originCountry.trim() ||
                        productToUpsert?.originCountry ||
                        "Китай",
                    packagingType:
                        toNullableString(row.packagingType) ||
                        productToUpsert?.packagingType ||
                        null,
                    packagingQuantity: row.packagingQuantity
                        ? toDecimal(row.packagingQuantity, "0")
                        : productToUpsert?.packagingQuantity ?? null,
                    packagingUnit:
                        row.packagingUnit ||
                        productToUpsert?.packagingUnit ||
                        null,
                    categoryId: category.id,
                    variantGroup:
                        toNullableString(row.variantGroup) ||
                        productToUpsert?.variantGroup ||
                        null,
                    variationName:
                        toNullableString(row.variationName) ||
                        productToUpsert?.variationName ||
                        null,
                    variantAttributes:
                        parseVariationAttributes(row.variationAttributes) ??
                        productToUpsert?.variantAttributes ??
                        Prisma.DbNull,
                } satisfies Prisma.ProductUncheckedCreateInput

                let productId = productToUpsert?.id

                if (productToUpsert) {
                    await tx.product.update({
                        where: { id: productToUpsert.id },
                        data: productData,
                    })
                    productId = productToUpsert.id
                    importStats.updated += 1
                } else {
                    const createdProduct = await tx.product.create({
                        data: productData,
                        select: { id: true },
                    })
                    productId = createdProduct.id
                    importStats.created += 1
                }

                if (!productId) {
                    throw new Error("Product import failed.")
                }

                if (imageUrls.length > 0) {
                    await replaceProductImages(tx, productId, imageUrls, row.name)
                }
            }

            await tx.bulkProductDraft.update({
                where: { id: draftId },
                data: {
                    status: "IMPORTED",
                    lastImportedAt: new Date(),
                    importSummary: {
                        processedRows: rows.length,
                        ...importStats,
                    },
                },
            })
        })

        revalidatePath("/admin/products")
        revalidatePath("/admin/products/new")
        revalidatePath("/admin/products/new/bulk")
        revalidatePath("/catalog")
        revalidatePath("/")

        const refreshedDraft = await prisma.bulkProductDraft.findUnique({
            where: { id: draftId },
        })

        if (!refreshedDraft) {
            return {
                success: true,
                importSummary: {
                    processedRows: rows.length,
                    ...importStats,
                },
            }
        }

        return {
            success: true,
            draft: serializeBulkProductDraft(refreshedDraft),
            importSummary: {
                processedRows: rows.length,
                ...importStats,
            },
        }
    } catch (error) {
        console.error("Import bulk product draft error:", error)
        return { error: "Failed to import products from the draft." }
    }
}
