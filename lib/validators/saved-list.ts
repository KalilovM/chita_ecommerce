import { z } from "zod"

export const CreateSavedListSchema = z.object({
    name: z.string().min(1, "Введите название списка").max(100, "Максимум 100 символов"),
    type: z.enum(["FAVORITES", "BASKET"]),
})

export type CreateSavedListData = z.infer<typeof CreateSavedListSchema>

export const UpdateSavedListSchema = z.object({
    name: z.string().min(1, "Введите название списка").max(100, "Максимум 100 символов"),
})

export type UpdateSavedListData = z.infer<typeof UpdateSavedListSchema>

export const AddListItemSchema = z.object({
    listId: z.string().min(1),
    productId: z.string().min(1),
    quantity: z.number().positive("Количество должно быть положительным").default(1),
})

export type AddListItemData = z.infer<typeof AddListItemSchema>
