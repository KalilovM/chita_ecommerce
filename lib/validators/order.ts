import { z } from "zod"
import { phoneSchema } from "./user"

export const CheckoutSchema = z.object({
    addressId: z.string().min(1, "Выберите адрес доставки"),
    deliveryDate: z.string().min(1, "Выберите дату доставки"),
    deliveryTimeSlot: z.string().min(1, "Выберите время доставки"),
    paymentMethod: z.enum(["cash", "card_on_delivery"], {
        message: "Выберите способ оплаты",
    }),
    notes: z.string().optional(),
})

export type CheckoutData = z.infer<typeof CheckoutSchema>

export const OrderStatusUpdateSchema = z.object({
    status: z.enum([
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "DELIVERING",
        "DELIVERED",
        "CANCELLED",
    ]),
    note: z.string().optional(),
})

export type OrderStatusUpdateData = z.infer<typeof OrderStatusUpdateSchema>

export const OrderSearchSchema = z.object({
    status: z
        .enum([
            "PENDING",
            "CONFIRMED",
            "PREPARING",
            "DELIVERING",
            "DELIVERED",
            "CANCELLED",
        ])
        .optional(),
    paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
    userId: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    orderNumber: z.string().optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
})

export type OrderSearchParams = z.infer<typeof OrderSearchSchema>

// Order item for manual order creation (admin)
export const ManualOrderItemSchema = z.object({
    productId: z.string().min(1),
    quantity: z.number().positive("Количество должно быть положительным"),
})

export const ManualOrderSchema = z.object({
    customerName: z.string().min(2, "Введите имя клиента"),
    customerPhone: phoneSchema,
    customerEmail: z.string().email("Введите корректный email").optional(),
    addressId: z.string().optional(),
    deliveryAddress: z.string().min(10, "Введите адрес доставки"),
    deliveryDate: z.string().min(1, "Выберите дату доставки"),
    deliveryTimeSlot: z.string().min(1, "Выберите время доставки"),
    paymentMethod: z.enum(["cash", "card_on_delivery"]),
    items: z.array(ManualOrderItemSchema).min(1, "Добавьте хотя бы один товар"),
    notes: z.string().optional(),
})

export type ManualOrderData = z.infer<typeof ManualOrderSchema>
