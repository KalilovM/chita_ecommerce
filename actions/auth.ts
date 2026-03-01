"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { UserRegistrationSchema } from "@/lib/validators/user"

export async function registerUser(data: {
    email: string
    password: string
    name: string
    phone?: string
}) {
    try {
        // Validate input
        const validationResult = UserRegistrationSchema.safeParse({
            ...data,
            confirmPassword: data.password,
        })

        if (!validationResult.success) {
            return { error: validationResult.error.issues[0].message }
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        })

        if (existingUser) {
            return { error: "Пользователь с таким email уже существует" }
        }

        // Check if phone is already taken
        if (data.phone) {
            const existingPhone = await prisma.user.findUnique({
                where: { phone: data.phone },
            })

            if (existingPhone) {
                return { error: "Пользователь с таким телефоном уже существует" }
            }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(data.password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email: data.email.toLowerCase(),
                name: data.name,
                phone: data.phone || null,
                passwordHash,
                role: "CUSTOMER",
            },
        })

        // Create empty cart for user
        await prisma.cart.create({
            data: {
                userId: user.id,
            },
        })

        return { success: true, userId: user.id }
    } catch (error) {
        console.error("Registration error:", error)
        return { error: "Ошибка при регистрации. Попробуйте позже." }
    }
}
