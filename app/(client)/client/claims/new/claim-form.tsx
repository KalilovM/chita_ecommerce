"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { createClaim } from "@/actions/client/claims"
import { ISSUE_TYPE_LABELS, RESOLUTION_LABELS } from "@/lib/validators/claim"
import { formatRussianDate } from "@/lib/utils/format"

interface OrderForClaim {
    id: string
    orderNumber: string
    createdAt: string
    items: {
        productId: string
        productName: string
        quantity: number
        unit: string
        image: string | null
    }[]
}

interface ClaimItemState {
    productId: string
    productName: string
    quantity: number
    issueType: string
    description: string
    photos: string[]
}

interface ClaimFormProps {
    orders: OrderForClaim[]
    preselectedOrderId?: string
}

export function ClaimForm({ orders, preselectedOrderId }: ClaimFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    // Step 1: Select order
    const [selectedOrderId, setSelectedOrderId] = useState(preselectedOrderId || "")
    const selectedOrder = orders.find((o) => o.id === selectedOrderId)

    // Step 2: Select items
    const [claimItems, setClaimItems] = useState<ClaimItemState[]>([])

    // Step 3: Resolution
    const [resolution, setResolution] = useState("")

    const addItem = (productId: string, productName: string) => {
        if (claimItems.some((i) => i.productId === productId)) return
        setClaimItems([
            ...claimItems,
            {
                productId,
                productName,
                quantity: 1,
                issueType: "",
                description: "",
                photos: [],
            },
        ])
    }

    const removeItem = (productId: string) => {
        setClaimItems(claimItems.filter((i) => i.productId !== productId))
    }

    const updateItem = (productId: string, update: Partial<ClaimItemState>) => {
        setClaimItems(
            claimItems.map((i) => (i.productId === productId ? { ...i, ...update } : i))
        )
    }

    const handleSubmit = () => {
        setError(null)

        if (!selectedOrderId) {
            setError("Выберите заказ")
            return
        }
        if (claimItems.length === 0) {
            setError("Добавьте хотя бы один товар")
            return
        }
        if (claimItems.some((i) => !i.issueType)) {
            setError("Выберите тип проблемы для каждого товара")
            return
        }
        if (!resolution) {
            setError("Выберите предпочтительное решение")
            return
        }

        startTransition(async () => {
            const result = await createClaim({
                orderId: selectedOrderId,
                items: claimItems.map((i) => ({
                    productId: i.productId,
                    productName: i.productName,
                    quantity: i.quantity,
                    issueType: i.issueType,
                    description: i.description || undefined,
                    photos: i.photos,
                })),
                preferredResolution: resolution,
            })

            if (result.error) {
                setError(result.error)
            } else if (result.claimId) {
                router.push(`/client/claims/${result.claimId}`)
            }
        })
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Step 1: Select Order */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">1. Выберите заказ</CardTitle>
                </CardHeader>
                <CardContent>
                    <select
                        value={selectedOrderId}
                        onChange={(e) => {
                            setSelectedOrderId(e.target.value)
                            setClaimItems([]) // Reset items on order change
                        }}
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    >
                        <option value="">Выберите заказ...</option>
                        {orders.map((order) => (
                            <option key={order.id} value={order.id}>
                                {order.orderNumber} — {formatRussianDate(order.createdAt)}
                            </option>
                        ))}
                    </select>
                </CardContent>
            </Card>

            {/* Step 2: Select Items */}
            {selectedOrder && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">2. Выберите товары и опишите проблему</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Available items to add */}
                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">
                                Товары из заказа:
                            </Label>
                            <div className="grid grid-cols-1 gap-2">
                                {selectedOrder.items.map((item) => {
                                    const isAdded = claimItems.some(
                                        (i) => i.productId === item.productId
                                    )
                                    return (
                                        <div
                                            key={item.productId}
                                            className="flex items-center gap-3 p-2 rounded border"
                                        >
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.productName}
                                                    className="w-8 h-8 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded bg-muted" />
                                            )}
                                            <span className="text-sm flex-1">{item.productName}</span>
                                            <Button
                                                type="button"
                                                variant={isAdded ? "destructive" : "outline"}
                                                size="sm"
                                                onClick={() =>
                                                    isAdded
                                                        ? removeItem(item.productId)
                                                        : addItem(item.productId, item.productName)
                                                }
                                            >
                                                {isAdded ? (
                                                    <>
                                                        <Trash2 className="h-3 w-3 mr-1" />
                                                        Убрать
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Добавить
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Selected items details */}
                        {claimItems.length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    {claimItems.map((item) => (
                                        <div
                                            key={item.productId}
                                            className="p-4 border rounded-lg space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm">
                                                    {item.productName}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive"
                                                    onClick={() => removeItem(item.productId)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs">Количество</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            updateItem(item.productId, {
                                                                quantity: Number(e.target.value),
                                                            })
                                                        }
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Тип проблемы *</Label>
                                                    <select
                                                        value={item.issueType}
                                                        onChange={(e) =>
                                                            updateItem(item.productId, {
                                                                issueType: e.target.value,
                                                            })
                                                        }
                                                        className="w-full border rounded-md px-3 py-2 text-sm bg-background mt-1"
                                                    >
                                                        <option value="">Выберите...</option>
                                                        {Object.entries(ISSUE_TYPE_LABELS).map(
                                                            ([key, label]) => (
                                                                <option key={key} value={key}>
                                                                    {label}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-xs">Описание</Label>
                                                <Textarea
                                                    value={item.description}
                                                    onChange={(e) =>
                                                        updateItem(item.productId, {
                                                            description: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Опишите проблему..."
                                                    rows={2}
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs">
                                                    Фотографии (до 10 шт.)
                                                </Label>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <div className="flex-1 border-2 border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground">
                                                        <Upload className="h-5 w-5 mx-auto mb-1" />
                                                        Перетащите файлы или нажмите для загрузки
                                                        <p className="text-xs mt-1">
                                                            JPG, PNG до 5 МБ каждый
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Photo upload integration point:
                                                    Connect to your file upload API/service here.
                                                    After upload, push URLs into item.photos array. */}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Resolution */}
            {claimItems.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            3. Предпочтительное решение
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {Object.entries(RESOLUTION_LABELS).map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setResolution(key)}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                                        resolution === key
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-muted hover:border-primary/50"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error */}
            {error && (
                <p className="text-sm text-destructive font-medium">{error}</p>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={() => router.push("/client/claims")}
                    disabled={isPending}
                >
                    Отмена
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={isPending || !selectedOrderId || claimItems.length === 0 || !resolution}
                >
                    {isPending ? "Отправка..." : "Отправить претензию"}
                </Button>
            </div>
        </div>
    )
}
