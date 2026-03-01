"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, Building2, Phone, MapPin, Clock, Truck, Globe } from "lucide-react"
import { updateSettings } from "@/actions/admin/settings"

interface Settings {
    siteName: string
    siteDescription: string
    companyName: string
    phone: string
    email: string
    whatsapp: string
    telegram: string
    city: string
    address: string
    workingHoursWeekdays: string
    workingHoursWeekends: string
    workingDays: string
    deliveryCutoffHour: string
    minOrderAmount: string
    freeDeliveryThreshold: string
    metaTitle: string
    metaDescription: string
    vkLink: string
    instagramLink: string
    footerText: string
    copyrightText: string
}

interface SettingsFormProps {
    settings: Settings
}

export function SettingsForm({ settings }: SettingsFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState(settings)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        startTransition(async () => {
            const result = await updateSettings(formData)
            if (result.error) {
                setError(result.error)
            } else {
                setSuccess(true)
                router.refresh()
                setTimeout(() => setSuccess(false), 3000)
            }
        })
    }

    const updateField = (key: keyof Settings, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Info */}
            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Информация о компании</CardTitle>
                    </div>
                    <CardDescription>
                        Основная информация о вашем магазине
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="siteName">Название сайта</Label>
                            <Input
                                id="siteName"
                                value={formData.siteName}
                                onChange={(e) => updateField("siteName", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Юридическое название</Label>
                            <Input
                                id="companyName"
                                value={formData.companyName}
                                onChange={(e) => updateField("companyName", e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="siteDescription">Описание сайта</Label>
                        <Textarea
                            id="siteDescription"
                            value={formData.siteDescription}
                            onChange={(e) => updateField("siteDescription", e.target.value)}
                            rows={2}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Контактная информация</CardTitle>
                    </div>
                    <CardDescription>
                        Контакты для связи с клиентами
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Телефон</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => updateField("phone", e.target.value)}
                                placeholder="+7 (XXX) XXX-XX-XX"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => updateField("email", e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp">WhatsApp</Label>
                            <Input
                                id="whatsapp"
                                value={formData.whatsapp}
                                onChange={(e) => updateField("whatsapp", e.target.value)}
                                placeholder="+7XXXXXXXXXX"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="telegram">Telegram</Label>
                            <Input
                                id="telegram"
                                value={formData.telegram}
                                onChange={(e) => updateField("telegram", e.target.value)}
                                placeholder="@username или ссылка"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Address */}
            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Адрес</CardTitle>
                    </div>
                    <CardDescription>
                        Расположение магазина/склада
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">Город</Label>
                            <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => updateField("city", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Полный адрес</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => updateField("address", e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Working Hours */}
            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Режим работы</CardTitle>
                    </div>
                    <CardDescription>
                        Часы работы магазина
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="workingDays">Рабочие дни</Label>
                            <Input
                                id="workingDays"
                                value={formData.workingDays}
                                onChange={(e) => updateField("workingDays", e.target.value)}
                                placeholder="Пн-Вс"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="workingHoursWeekdays">Часы в будни</Label>
                            <Input
                                id="workingHoursWeekdays"
                                value={formData.workingHoursWeekdays}
                                onChange={(e) => updateField("workingHoursWeekdays", e.target.value)}
                                placeholder="8:00 - 20:00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="workingHoursWeekends">Часы в выходные</Label>
                            <Input
                                id="workingHoursWeekends"
                                value={formData.workingHoursWeekends}
                                onChange={(e) => updateField("workingHoursWeekends", e.target.value)}
                                placeholder="9:00 - 18:00"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Delivery Settings */}
            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <Truck className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Настройки доставки</CardTitle>
                    </div>
                    <CardDescription>
                        Параметры доставки заказов
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="deliveryCutoffHour">Час закрытия приёма (на завтра)</Label>
                            <Input
                                id="deliveryCutoffHour"
                                type="number"
                                min="0"
                                max="23"
                                value={formData.deliveryCutoffHour}
                                onChange={(e) => updateField("deliveryCutoffHour", e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                После этого часа заказы принимаются на послезавтра
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minOrderAmount">Минимальная сумма заказа (руб.)</Label>
                            <Input
                                id="minOrderAmount"
                                type="number"
                                min="0"
                                value={formData.minOrderAmount}
                                onChange={(e) => updateField("minOrderAmount", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="freeDeliveryThreshold">Бесплатная доставка от (руб.)</Label>
                            <Input
                                id="freeDeliveryThreshold"
                                type="number"
                                min="0"
                                value={formData.freeDeliveryThreshold}
                                onChange={(e) => updateField("freeDeliveryThreshold", e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* SEO */}
            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>SEO настройки</CardTitle>
                    </div>
                    <CardDescription>
                        Настройки для поисковых систем
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input
                            id="metaTitle"
                            value={formData.metaTitle}
                            onChange={(e) => updateField("metaTitle", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <Textarea
                            id="metaDescription"
                            value={formData.metaDescription}
                            onChange={(e) => updateField("metaDescription", e.target.value)}
                            rows={2}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Social & Footer */}
            <Card>
                <CardHeader>
                    <CardTitle>Соцсети и подвал</CardTitle>
                    <CardDescription>
                        Ссылки на социальные сети и текст подвала
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="vkLink">ВКонтакте</Label>
                            <Input
                                id="vkLink"
                                value={formData.vkLink}
                                onChange={(e) => updateField("vkLink", e.target.value)}
                                placeholder="https://vk.com/..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instagramLink">Instagram</Label>
                            <Input
                                id="instagramLink"
                                value={formData.instagramLink}
                                onChange={(e) => updateField("instagramLink", e.target.value)}
                                placeholder="https://instagram.com/..."
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="footerText">Текст в подвале</Label>
                        <Textarea
                            id="footerText"
                            value={formData.footerText}
                            onChange={(e) => updateField("footerText", e.target.value)}
                            rows={2}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="copyrightText">Копирайт</Label>
                        <Input
                            id="copyrightText"
                            value={formData.copyrightText}
                            onChange={(e) => updateField("copyrightText", e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}

            {success && (
                <p className="text-sm text-green-600">Настройки сохранены!</p>
            )}

            <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                    {isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Сохранить настройки
                </Button>
            </div>
        </form>
    )
}
