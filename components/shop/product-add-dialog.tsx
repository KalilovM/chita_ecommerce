"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ShoppingCart, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { QuantitySelector } from "@/components/shop/quantity-selector"
import { formatQuantity, formatRussianCurrency, getUnitLabel } from "@/lib/utils/format"

interface ProductAddDialogProps {
    open: boolean
    product: {
        name: string
        slug: string
        price: number
        unit: string
        minOrderQuantity: number
        stepQuantity: number
    }
    quantity: number
    isLoading: boolean
    onClose: () => void
    onQuantityChange: (quantity: number) => void
    onConfirm: () => void
}

export function ProductAddDialog({
    open,
    product,
    quantity,
    isLoading,
    onClose,
    onQuantityChange,
    onConfirm,
}: ProductAddDialogProps) {
    useEffect(() => {
        if (!open) {
            return
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose()
            }
        }

        document.body.classList.add("overflow-hidden")
        window.addEventListener("keydown", handleKeyDown)

        return () => {
            document.body.classList.remove("overflow-hidden")
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [onClose, open])

    if (!open) {
        return null
    }

    const selectorUnit = product.unit === "KG" ? "кг" : "шт"

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`product-add-dialog-${product.slug}`}
        >
            <Card
                className="w-full max-w-md border-white/80 bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                    <div className="space-y-2">
                        <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                            Добавить в корзину
                        </p>
                        <CardTitle id={`product-add-dialog-${product.slug}`} className="text-xl leading-tight">
                            {product.name}
                        </CardTitle>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        aria-label="Закрыть окно"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="rounded-xl bg-emerald-50/70 p-4">
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="text-sm text-slate-600">Цена</span>
                            <span className="text-xl font-bold text-emerald-700">
                                {formatRussianCurrency(product.price)}
                            </span>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between gap-3 text-sm text-slate-600">
                            <span>Единица</span>
                            <span>{getUnitLabel(product.unit)}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-foreground">Минимальный заказ</span>
                            <span className="font-medium">
                                {formatQuantity(product.minOrderQuantity, product.unit)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-foreground">Шаг добавления</span>
                            <span className="font-medium">
                                {formatQuantity(product.stepQuantity, product.unit)}
                            </span>
                        </div>
                        <QuantitySelector
                            value={quantity}
                            min={product.minOrderQuantity}
                            step={product.stepQuantity}
                            unit={selectorUnit}
                            onChange={onQuantityChange}
                            disabled={isLoading}
                            className="justify-between"
                        />
                    </div>

                    <Link
                        href={`/product/${product.slug}`}
                        className="inline-flex text-sm font-medium text-primary hover:underline"
                        onClick={onClose}
                    >
                        Открыть страницу товара
                    </Link>
                </CardContent>

                <CardFooter className="flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Отмена
                    </Button>
                    <Button
                        type="button"
                        className="w-full sm:w-auto"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Добавить
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
