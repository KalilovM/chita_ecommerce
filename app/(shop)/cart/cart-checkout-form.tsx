"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createOrder } from "@/actions/orders"
import {
    FREE_CITY_DELIVERY_THRESHOLD,
    getCartDeliveryContext,
} from "@/lib/utils/delivery"
import { formatRussianCurrency } from "@/lib/utils/format"

const CHECKOUT_STORAGE_KEY = "chita_checkout_draft"

interface CartCheckoutFormProps {
    isAuthenticated: boolean
    user: {
        name: string
        email: string
        phone: string | null
    } | null
    defaultAddress: {
        id: string
        fullAddress: string
    } | null
    orderTotal: number
}

export function CartCheckoutForm({
    isAuthenticated,
    user,
    defaultAddress,
    orderTotal,
}: CartCheckoutFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        customerName: user?.name || "",
        customerPhone: user?.phone || "",
        customerEmail: user?.email || "",
        deliveryArea: "CITY" as "CITY" | "OUTSIDE_CITY",
        deliveryAddress: "",
        notes: "",
    })
    const deliveryContext = getCartDeliveryContext(orderTotal)
    const isOutsideCity = !defaultAddress && formData.deliveryArea === "OUTSIDE_CITY"

    useEffect(() => {
        const storedDraft = window.localStorage.getItem(CHECKOUT_STORAGE_KEY)
        if (!storedDraft) {
            return
        }

        try {
            const parsedDraft = JSON.parse(storedDraft) as typeof formData
            setFormData((current) => ({
                ...current,
                ...parsedDraft,
                customerName: parsedDraft.customerName || current.customerName,
                customerPhone: parsedDraft.customerPhone || current.customerPhone,
                customerEmail: parsedDraft.customerEmail || current.customerEmail,
            }))
        } catch (draftError) {
            console.error("Failed to restore checkout draft:", draftError)
        }
    }, [])

    useEffect(() => {
        window.localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(formData))
    }, [formData])

    const handleChange = (key: keyof typeof formData, value: string) => {
        setFormData((current) => ({
            ...current,
            [key]: value,
        }))
    }

    const handleSubmit = () => {
        setError(null)
        setSuccess(null)

        startTransition(async () => {
            const result = await createOrder({
                customerName: formData.customerName,
                customerPhone: formData.customerPhone,
                customerEmail: formData.customerEmail,
                addressId: defaultAddress?.id,
                deliveryArea: formData.deliveryArea,
                deliveryAddress: defaultAddress ? undefined : formData.deliveryAddress,
                notes: formData.notes,
            })

            if (result.error) {
                setError(result.error)
                return
            }

            window.localStorage.removeItem(CHECKOUT_STORAGE_KEY)
            const orderNumber = result.orderNumber || "без номера"
            setSuccess(orderNumber)
            router.push(`/cart?success=${orderNumber}`)
            router.refresh()
        })
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold">Оформление заявки</h2>
                <p className="text-sm text-muted-foreground">
                    Мы свяжемся с вами по телефону, подтвердим адрес и уточним детали поставки.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="customerName">
                    {isAuthenticated ? "Контактное лицо" : "Имя или контактное лицо"}
                </Label>
                <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleChange("customerName", e.target.value)}
                    placeholder="Иван Иванов"
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="customerPhone">Телефон</Label>
                    <Input
                        id="customerPhone"
                        value={formData.customerPhone}
                        onChange={(e) => handleChange("customerPhone", e.target.value)}
                        placeholder="+7 (999) 123-45-67"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="customerEmail">Электронная почта</Label>
                    <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => handleChange("customerEmail", e.target.value)}
                        placeholder="buyer@company.ru"
                    />
                </div>
            </div>

            {!defaultAddress && (
                <div className="space-y-2">
                    <Label>Зона доставки</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => handleChange("deliveryArea", "CITY")}
                            className={`rounded-lg border p-3 text-left transition ${
                                formData.deliveryArea === "CITY"
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-background"
                            }`}
                        >
                            <p className="text-sm font-medium">По Чите</p>
                            <p className="text-xs text-muted-foreground">
                                Бесплатно при заказе свыше {formatRussianCurrency(FREE_CITY_DELIVERY_THRESHOLD)}
                            </p>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleChange("deliveryArea", "OUTSIDE_CITY")}
                            className={`rounded-lg border p-3 text-left transition ${
                                formData.deliveryArea === "OUTSIDE_CITY"
                                    ? "border-amber-500 bg-amber-50"
                                    : "border-border bg-background"
                            }`}
                        >
                            <p className="text-sm font-medium">За пределами города</p>
                            <p className="text-xs text-muted-foreground">
                                Оформляется через менеджера
                            </p>
                        </button>
                    </div>
                </div>
            )}

            {defaultAddress ? (
                <div className="rounded-lg border bg-muted/40 p-4">
                    <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">Адрес из профиля</p>
                            <p className="text-sm text-muted-foreground">
                                {defaultAddress.fullAddress}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Если адрес изменился, обновите его в кабинете или сообщите менеджеру в комментарии.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <Label htmlFor="deliveryAddress">Адрес доставки</Label>
                    <Textarea
                        id="deliveryAddress"
                        value={formData.deliveryAddress}
                        onChange={(e) => handleChange("deliveryAddress", e.target.value)}
                        placeholder="г. Чита, улица, дом, офис/склад, ориентир"
                        rows={4}
                    />
                </div>
            )}

            <div
                className={`rounded-lg border p-3 text-sm ${
                    isOutsideCity
                        ? "border-amber-200 bg-amber-50 text-amber-900"
                        : deliveryContext.isFree
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-border bg-muted/30 text-muted-foreground"
                }`}
            >
                {isOutsideCity
                    ? "Доставка за пределы Читы оформляется только через менеджера."
                    : deliveryContext.isFree
                        ? "Для этой корзины доставка по Чите будет бесплатной."
                        : `Бесплатная доставка по Чите действует при заказе свыше ${formatRussianCurrency(FREE_CITY_DELIVERY_THRESHOLD)}. Для текущей корзины условия уточнит менеджер.`}
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Комментарий</Label>
                <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Удобное время звонка, комментарий по адресу, особенности разгрузки"
                    rows={3}
                />
            </div>

            {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                    Заявка {success} отправлена. Мы свяжемся с вами в ближайшее время.
                </div>
            )}

            <Button
                type="button"
                className="w-full"
                size="lg"
                disabled={isPending || isOutsideCity}
                onClick={handleSubmit}
            >
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Отправляем заявку
                    </>
                ) : isOutsideCity ? (
                    "Свяжитесь с менеджером"
                ) : (
                    <>
                        <Phone className="mr-2 h-4 w-4" />
                        Отправить заявку
                    </>
                )}
            </Button>
        </div>
    )
}
