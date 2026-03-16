"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createOrder } from "@/actions/orders"

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
}

export function CartCheckoutForm({
    isAuthenticated,
    user,
    defaultAddress,
}: CartCheckoutFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        customerName: user?.name || "",
        customerPhone: user?.phone || "",
        customerEmail: user?.email || "",
        deliveryAddress: "",
        notes: "",
    })

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
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => handleChange("customerEmail", e.target.value)}
                        placeholder="buyer@company.ru"
                    />
                </div>
            </div>

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
                disabled={isPending}
                onClick={handleSubmit}
            >
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Отправляем заявку
                    </>
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
