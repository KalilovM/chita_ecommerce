import { z } from "zod"

export const ProductFormSchema = z.object({
    name: z
        .string()
        .min(2, "Название должно содержать минимум 2 символа")
        .max(100, "Название слишком длинное"),
    slug: z
        .string()
        .min(2, "Slug должен содержать минимум 2 символа")
        .regex(/^[a-z0-9-]+$/, "Slug может содержать только латинские буквы, цифры и дефисы"),
    description: z.string().optional(),
    shortDescription: z.string().max(200, "Краткое описание слишком длинное").optional(),
    categoryId: z.string().min(1, "Выберите категорию"),
    retailPrice: z
        .number()
        .positive("Цена должна быть положительной")
        .or(z.string().transform((val) => parseFloat(val))),
    wholesalePrice: z
        .number()
        .positive("Оптовая цена должна быть положительной")
        .or(z.string().transform((val) => parseFloat(val))),
    costPrice: z
        .number()
        .positive("Себестоимость должна быть положительной")
        .optional()
        .or(z.string().transform((val) => (val ? parseFloat(val) : undefined))),
    unit: z.enum(["KG", "PIECE", "BOX", "BUNCH"]),
    minOrderQuantity: z
        .number()
        .positive("Минимальное количество должно быть положительным")
        .or(z.string().transform((val) => parseFloat(val)))
        .default(1),
    stepQuantity: z
        .number()
        .positive("Шаг количества должен быть положительным")
        .or(z.string().transform((val) => parseFloat(val)))
        .default(0.1),
    stockQuantity: z
        .number()
        .min(0, "Количество на складе не может быть отрицательным")
        .or(z.string().transform((val) => parseFloat(val)))
        .default(0),
    lowStockThreshold: z
        .number()
        .min(0)
        .or(z.string().transform((val) => parseFloat(val)))
        .default(10),
    isActive: z.boolean().default(true),
    isHit: z.boolean().default(false),
    isNew: z.boolean().default(false),
    originCountry: z.string().default("Китай"),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
})

export type ProductFormData = z.infer<typeof ProductFormSchema>

export const ProductSearchSchema = z.object({
    query: z.string().optional(),
    categoryId: z.string().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    isHit: z.boolean().optional(),
    isNew: z.boolean().optional(),
    inStock: z.boolean().optional(),
    sortBy: z.enum(["name", "price", "createdAt"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
})

export type ProductSearchParams = z.infer<typeof ProductSearchSchema>
