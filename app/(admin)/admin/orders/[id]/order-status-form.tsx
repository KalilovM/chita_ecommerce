"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { updateOrderStatus } from "@/actions/admin/orders"

interface OrderStatusFormProps {
    orderId: string
    currentStatus: string
}

const statuses = [
    { value: "PENDING", label: "Ожидает" },
    { value: "CONFIRMED", label: "Подтверждён" },
    { value: "PREPARING", label: "Собирается" },
    { value: "DELIVERING", label: "Доставляется" },
    { value: "DELIVERED", label: "Доставлен" },
    { value: "CANCELLED", label: "Отменён" },
]

export function OrderStatusForm({ orderId, currentStatus }: OrderStatusFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [status, setStatus] = useState(currentStatus)
    const [note, setNote] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (status === currentStatus) {
            setError("Выберите другой статус")
            return
        }

        startTransition(async () => {
            const result = await updateOrderStatus(orderId, status, note)
            if (result.error) {
                setError(result.error)
            } else {
                setNote("")
                router.refresh()
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Новый статус</Label>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                    {statuses.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="note">Комментарий (необязательно)</Label>
                <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Добавьте комментарий к изменению статуса..."
                    rows={2}
                />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={isPending} className="w-full">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Обновить статус
            </Button>
        </form>
    )
}
