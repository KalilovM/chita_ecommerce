import { z } from "zod"
import { phoneSchema } from "./user"

export const WholesaleProfileSchema = z.object({
    companyName: z.string().min(2, "Введите название компании"),
    inn: z
        .string()
        .regex(/^\d{10}$|^\d{12}$/, "ИНН должен содержать 10 или 12 цифр")
        .optional()
        .or(z.literal("")),
    kpp: z
        .string()
        .regex(/^\d{9}$/, "КПП должен содержать 9 цифр")
        .optional()
        .or(z.literal("")),
    ogrn: z
        .string()
        .regex(/^\d{13}$|^\d{15}$/, "ОГРН должен содержать 13 или 15 цифр")
        .optional()
        .or(z.literal("")),
    legalAddress: z.string().optional(),
    contactPerson: z.string().min(2, "Введите имя контактного лица"),
    contactPhone: phoneSchema,
    contactEmail: z.string().email("Введите корректный email").optional().or(z.literal("")),
})

export type WholesaleProfileData = z.infer<typeof WholesaleProfileSchema>

export const NotificationPreferencesSchema = z.object({
    emailNotifications: z.boolean().default(true),
    smsNotifications: z.boolean().default(false),
    telegramNotifications: z.boolean().default(false),
})

export type NotificationPreferencesData = z.infer<typeof NotificationPreferencesSchema>
