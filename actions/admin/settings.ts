"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

interface SettingsData {
    [key: string]: string
}

export async function updateSettings(data: SettingsData) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return { error: "Нет доступа" }
    }

    try {
        // Update or create each setting
        for (const [key, value] of Object.entries(data)) {
            await prisma.systemSetting.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            })
        }

        revalidatePath("/admin/settings")
        revalidatePath("/")

        return { success: true }
    } catch (error) {
        console.error("Update settings error:", error)
        return { error: "Ошибка при сохранении настроек" }
    }
}

export async function getSetting(key: string): Promise<string | null> {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key },
        })
        return setting?.value || null
    } catch (error) {
        console.error("Get setting error:", error)
        return null
    }
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: { key: { in: keys } },
        })

        const result: Record<string, string> = {}
        settings.forEach(s => {
            result[s.key] = s.value
        })
        return result
    } catch (error) {
        console.error("Get settings error:", error)
        return {}
    }
}

export async function getAllSettings(): Promise<Record<string, string>> {
    try {
        const settings = await prisma.systemSetting.findMany()

        const result: Record<string, string> = {}
        settings.forEach(s => {
            result[s.key] = s.value
        })
        return result
    } catch (error) {
        console.error("Get all settings error:", error)
        return {}
    }
}
