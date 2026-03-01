"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Loader2 } from "lucide-react"
import { updateClient } from "@/actions/admin/clients"

interface Client {
    id: string
    email: string
    name: string
    phone: string | null
    role: string
    isWholesale: boolean
    personalDiscount: any
}

interface EditClientDialogProps {
    client: Client
    onClose: () => void
}

export function EditClientDialog({ client, onClose }: EditClientDialogProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: client.name,
        phone: client.phone || "",
        isWholesale: client.isWholesale,
        personalDiscount: Number(client.personalDiscount),
        role: client.role,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        startTransition(async () => {
            const result = await updateClient(client.id, formData)
            if (result.error) {
                setError(result.error)
            } else {
                router.refresh()
                onClose()
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />
            <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Редактировать клиента</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={client.email} disabled className="bg-muted" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Имя</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Телефон</Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) =>
                                setFormData({ ...formData, phone: e.target.value })
                            }
                            placeholder="+7 (XXX) XXX-XX-XX"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="discount">Персональная скидка (%)</Label>
                        <Input
                            id="discount"
                            type="number"
                            min="0"
                            max="100"
                            value={formData.personalDiscount}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    personalDiscount: Number(e.target.value),
                                })
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Тип клиента</Label>
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={!formData.isWholesale}
                                    onChange={() =>
                                        setFormData({ ...formData, isWholesale: false })
                                    }
                                    className="w-4 h-4"
                                />
                                <span>Розничный</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={formData.isWholesale}
                                    onChange={() =>
                                        setFormData({ ...formData, isWholesale: true })
                                    }
                                    className="w-4 h-4"
                                />
                                <span>Оптовый</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Роль</Label>
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={formData.role === "CUSTOMER"}
                                    onChange={() =>
                                        setFormData({ ...formData, role: "CUSTOMER" })
                                    }
                                    className="w-4 h-4"
                                />
                                <span>Клиент</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={formData.role === "ADMIN"}
                                    onChange={() =>
                                        setFormData({ ...formData, role: "ADMIN" })
                                    }
                                    className="w-4 h-4"
                                />
                                <span>Администратор</span>
                            </label>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Отмена
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Сохранить
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
