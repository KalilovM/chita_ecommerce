import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SettingsForm } from "./settings-form"

// Default settings structure
const defaultSettings = {
    // Company Info
    siteName: "СвежиеОвощи",
    siteDescription: "Свежие овощи и фрукты из Китая с доставкой по Чите",
    companyName: "ООО СвежиеОвощи",

    // Contact Info
    phone: "+7 (3022) 00-00-00",
    email: "info@freshproduce.ru",
    whatsapp: "",
    telegram: "",

    // Address
    city: "Чита",
    address: "г. Чита, ул. Примерная, д. 1",

    // Working Hours
    workingHoursWeekdays: "8:00 - 20:00",
    workingHoursWeekends: "9:00 - 18:00",
    workingDays: "Пн-Вс",

    // Delivery Settings
    deliveryCutoffHour: "18",
    minOrderAmount: "500",
    freeDeliveryThreshold: "3000",

    // SEO
    metaTitle: "СвежиеОвощи - Свежие овощи и фрукты в Чите",
    metaDescription: "Доставка свежих овощей и фруктов по Чите. Оптовые и розничные цены.",

    // Social Links
    vkLink: "",
    instagramLink: "",

    // Footer
    footerText: "Свежие овощи и фрукты из Китая с доставкой по Чите. Розничная и оптовая продажа.",
    copyrightText: "СвежиеОвощи. Все права защищены.",
}

async function getSettings() {
    const settings = await prisma.systemSetting.findMany()

    const settingsMap: Record<string, string> = {}
    settings.forEach(s => {
        settingsMap[s.key] = s.value
    })

    // Merge with defaults
    return {
        ...defaultSettings,
        ...settingsMap,
    }
}

export default async function SettingsPage() {
    const settings = await getSettings()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Настройки сайта</h1>
                <p className="text-muted-foreground">
                    Управление информацией о компании и настройками сайта
                </p>
            </div>

            <SettingsForm settings={settings} />
        </div>
    )
}
