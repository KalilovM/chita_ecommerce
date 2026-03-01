import { z } from "zod"

export const ClaimItemSchema = z.object({
    productId: z.string().min(1, "Выберите товар"),
    productName: z.string().min(1),
    quantity: z.number().positive("Количество должно быть положительным"),
    issueType: z.enum(["DAMAGED", "ROTTEN", "MISSING", "WRONG_ITEM", "OTHER"], {
        message: "Выберите тип проблемы",
    }),
    description: z.string().optional(),
    photos: z.array(z.string().url()).max(10, "Максимум 10 фотографий"),
})

export type ClaimItemData = z.infer<typeof ClaimItemSchema>

export const CreateClaimSchema = z.object({
    orderId: z.string().min(1, "Выберите заказ"),
    items: z.array(ClaimItemSchema).min(1, "Добавьте хотя бы один товар"),
    preferredResolution: z.enum(["REFUND", "CREDIT", "REPLACEMENT"], {
        message: "Выберите предпочтительное решение",
    }),
})

export type CreateClaimData = z.infer<typeof CreateClaimSchema>

export const ISSUE_TYPE_LABELS: Record<string, string> = {
    DAMAGED: "Повреждённый товар",
    ROTTEN: "Испорченный товар",
    MISSING: "Недостача",
    WRONG_ITEM: "Неверный товар",
    OTHER: "Другое",
}

export const RESOLUTION_LABELS: Record<string, string> = {
    REFUND: "Возврат средств",
    CREDIT: "Кредит на счёт",
    REPLACEMENT: "Замена товара",
}

export const CLAIM_STATUS_LABELS: Record<string, string> = {
    SUBMITTED: "Подана",
    REVIEWING: "На рассмотрении",
    RESOLVED: "Решена",
    REJECTED: "Отклонена",
}
