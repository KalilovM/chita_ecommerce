import { formatRussianCurrency } from "@/lib/utils/format"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface OrderSummaryProps {
    subtotal: number
    discountAmount?: number
    discountPercent?: number
    deliveryCost?: number
    freeDeliveryThreshold?: number
    total: number
    className?: string
}

export function OrderSummary({
    subtotal,
    discountAmount = 0,
    discountPercent = 0,
    deliveryCost = 0,
    freeDeliveryThreshold,
    total,
    className,
}: OrderSummaryProps) {
    const amountToFreeDelivery = freeDeliveryThreshold
        ? freeDeliveryThreshold - subtotal
        : null

    return (
        <div className={cn("space-y-4", className)}>
            <h3 className="font-semibold">Итого</h3>

            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Сумма товаров</span>
                    <span>{formatRussianCurrency(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Скидка{discountPercent > 0 ? ` (${discountPercent}%)` : ""}</span>
                        <span>-{formatRussianCurrency(discountAmount)}</span>
                    </div>
                )}

                {deliveryCost !== undefined && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Доставка</span>
                        <span>
                            {deliveryCost === 0 ? (
                                <span className="text-green-600">Бесплатно</span>
                            ) : (
                                formatRussianCurrency(deliveryCost)
                            )}
                        </span>
                    </div>
                )}

                {amountToFreeDelivery && amountToFreeDelivery > 0 && (
                    <p className="text-xs text-muted-foreground">
                        До бесплатной доставки: {formatRussianCurrency(amountToFreeDelivery)}
                    </p>
                )}
            </div>

            <Separator />

            <div className="flex justify-between font-semibold text-lg">
                <span>К оплате</span>
                <span className="text-primary">{formatRussianCurrency(total)}</span>
            </div>
        </div>
    )
}
