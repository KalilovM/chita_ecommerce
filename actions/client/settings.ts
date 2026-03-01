"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { WholesaleProfileSchema } from "@/lib/validators/wholesale"
import { AddressFormSchema } from "@/lib/validators/address"

export async function getWholesaleProfile() {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    try {
        const profile = await prisma.wholesaleProfile.findUnique({
            where: { userId: session.user.id },
        })

        return profile
    } catch (error) {
        console.error("Get wholesale profile error:", error)
        return null
    }
}

export async function upsertWholesaleProfile(data: {
    companyName: string
    inn?: string
    kpp?: string
    ogrn?: string
    legalAddress?: string
    contactPerson: string
    contactPhone: string
    contactEmail?: string
}) {
    const session = await auth()

    if (!session?.user) {
        return { error: "Необходима авторизация" }
    }

    const validation = WholesaleProfileSchema.safeParse(data)
    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const validated = validation.data

    try {
        const existing = await prisma.wholesaleProfile.findUnique({
            where: { userId: session.user.id },
        })

        if (existing) {
            // Don't allow editing if already verified — only admin can change
            if (existing.verificationStatus === "VERIFIED") {
                return { error: "Профиль уже верифицирован. Обратитесь к администратору для изменений." }
            }

            await prisma.wholesaleProfile.update({
                where: { userId: session.user.id },
                data: {
                    ...validated,
                    inn: validated.inn || null,
                    kpp: validated.kpp || null,
                    ogrn: validated.ogrn || null,
                    contactEmail: validated.contactEmail || null,
                    // Reset status to PENDING on re-submission after rejection
                    verificationStatus: existing.verificationStatus === "REJECTED" ? "PENDING" : existing.verificationStatus,
                },
            })
        } else {
            await prisma.wholesaleProfile.create({
                data: {
                    userId: session.user.id,
                    companyName: validated.companyName,
                    inn: validated.inn || null,
                    kpp: validated.kpp || null,
                    ogrn: validated.ogrn || null,
                    legalAddress: validated.legalAddress,
                    contactPerson: validated.contactPerson,
                    contactPhone: validated.contactPhone,
                    contactEmail: validated.contactEmail || null,
                    verificationStatus: "PENDING",
                },
            })
        }

        revalidatePath("/client/settings")
        revalidatePath("/client")

        return { success: true }
    } catch (error) {
        console.error("Upsert wholesale profile error:", error)
        return { error: "Ошибка при сохранении профиля" }
    }
}

export async function getAddresses() {
    const session = await auth()

    if (!session?.user) {
        return []
    }

    try {
        const addresses = await prisma.address.findMany({
            where: { userId: session.user.id },
            include: {
                deliveryZone: {
                    select: { name: true },
                },
            },
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        })

        return addresses
    } catch (error) {
        console.error("Get addresses error:", error)
        return []
    }
}

export async function createAddress(data: {
    label?: string
    fullAddress: string
    city?: string
    street: string
    building: string
    apartment?: string
    entrance?: string
    floor?: string
    intercom?: string
    latitude: number
    longitude: number
    isDefault?: boolean
}) {
    const session = await auth()

    if (!session?.user) {
        return { error: "Необходима авторизация" }
    }

    const validation = AddressFormSchema.safeParse(data)
    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const validated = validation.data

    try {
        // If setting as default, unset others
        if (validated.isDefault) {
            await prisma.address.updateMany({
                where: { userId: session.user.id, isDefault: true },
                data: { isDefault: false },
            })
        }

        const address = await prisma.address.create({
            data: {
                userId: session.user.id,
                ...validated,
            },
        })

        revalidatePath("/client/settings")

        return { success: true, addressId: address.id }
    } catch (error) {
        console.error("Create address error:", error)
        return { error: "Ошибка при создании адреса" }
    }
}

export async function updateAddress(addressId: string, data: {
    label?: string
    fullAddress: string
    city?: string
    street: string
    building: string
    apartment?: string
    entrance?: string
    floor?: string
    intercom?: string
    latitude: number
    longitude: number
    isDefault?: boolean
}) {
    const session = await auth()

    if (!session?.user) {
        return { error: "Необходима авторизация" }
    }

    const validation = AddressFormSchema.safeParse(data)
    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const validated = validation.data

    try {
        // Verify ownership (IDOR prevention)
        const address = await prisma.address.findFirst({
            where: { id: addressId, userId: session.user.id },
        })

        if (!address) {
            return { error: "Адрес не найден" }
        }

        // If setting as default, unset others
        if (validated.isDefault) {
            await prisma.address.updateMany({
                where: { userId: session.user.id, isDefault: true, id: { not: addressId } },
                data: { isDefault: false },
            })
        }

        await prisma.address.update({
            where: { id: addressId },
            data: validated,
        })

        revalidatePath("/client/settings")

        return { success: true }
    } catch (error) {
        console.error("Update address error:", error)
        return { error: "Ошибка при обновлении адреса" }
    }
}

export async function deleteAddress(addressId: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "Необходима авторизация" }
    }

    try {
        // Verify ownership (IDOR prevention)
        const address = await prisma.address.findFirst({
            where: { id: addressId, userId: session.user.id },
        })

        if (!address) {
            return { error: "Адрес не найден" }
        }

        // Check if address is used in any orders
        const ordersUsingAddress = await prisma.order.count({
            where: { addressId },
        })

        if (ordersUsingAddress > 0) {
            return { error: "Этот адрес используется в заказах и не может быть удалён" }
        }

        await prisma.address.delete({
            where: { id: addressId },
        })

        revalidatePath("/client/settings")

        return { success: true }
    } catch (error) {
        console.error("Delete address error:", error)
        return { error: "Ошибка при удалении адреса" }
    }
}

export async function setDefaultAddress(addressId: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "Необходима авторизация" }
    }

    try {
        // Verify ownership (IDOR prevention)
        const address = await prisma.address.findFirst({
            where: { id: addressId, userId: session.user.id },
        })

        if (!address) {
            return { error: "Адрес не найден" }
        }

        // Unset all other defaults
        await prisma.address.updateMany({
            where: { userId: session.user.id, isDefault: true },
            data: { isDefault: false },
        })

        await prisma.address.update({
            where: { id: addressId },
            data: { isDefault: true },
        })

        revalidatePath("/client/settings")

        return { success: true }
    } catch (error) {
        console.error("Set default address error:", error)
        return { error: "Ошибка при установке адреса по умолчанию" }
    }
}
