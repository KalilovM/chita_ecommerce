import { z } from "zod"

// Russian phone validation: +7 (XXX) XXX-XX-XX or 7XXXXXXXXXX or 8XXXXXXXXXX
export const phoneSchema = z
    .string()
    .regex(
        /^(\+7|7|8)?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/,
        "Введите корректный номер телефона"
    )

export const UserRegistrationSchema = z.object({
    email: z.string().email("Введите корректный email"),
    password: z
        .string()
        .min(8, "Пароль должен содержать минимум 8 символов")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Пароль должен содержать заглавную букву, строчную букву и цифру"
        ),
    confirmPassword: z.string(),
    name: z.string().min(2, "Введите ваше имя"),
    phone: phoneSchema.optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
})

export type UserRegistrationData = z.infer<typeof UserRegistrationSchema>

export const UserLoginSchema = z.object({
    email: z.string().email("Введите корректный email"),
    password: z.string().min(1, "Введите пароль"),
})

export type UserLoginData = z.infer<typeof UserLoginSchema>

export const UserProfileSchema = z.object({
    name: z.string().min(2, "Введите ваше имя"),
    email: z.string().email("Введите корректный email"),
    phone: phoneSchema.optional().or(z.literal("")),
})

export type UserProfileData = z.infer<typeof UserProfileSchema>

export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: z
        .string()
        .min(8, "Пароль должен содержать минимум 8 символов")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Пароль должен содержать заглавную букву, строчную букву и цифру"
        ),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
})

export type ChangePasswordData = z.infer<typeof ChangePasswordSchema>

export const AdminUserUpdateSchema = z.object({
    role: z.enum(["CUSTOMER", "WHOLESALE", "ADMIN"]).optional(),
    isWholesale: z.boolean().optional(),
    personalDiscount: z
        .number()
        .min(0, "Скидка не может быть отрицательной")
        .max(100, "Скидка не может быть больше 100%")
        .optional(),
})

export type AdminUserUpdateData = z.infer<typeof AdminUserUpdateSchema>
