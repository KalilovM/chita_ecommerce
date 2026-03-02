import { Decimal } from "@prisma/client/runtime/library"
import { formatRussianCurrency } from "./format"

interface PriceCalculationParams {
    price: Decimal | number
    quantity: number
    personalDiscount: number // percentage, e.g., 10 for 10%
}

interface PriceResult {
    unitPrice: number
    originalPrice: number // Before discount
    finalPrice: number // After discount
    discountAmount: number
    displayPrice: string // Formatted Russian currency
    displayOriginalPrice: string
    hasDiscount: boolean
}

/**
 * Calculate price with a single catalog price and optional personal discount.
 */
export function calculatePrice({
    price,
    quantity,
    personalDiscount,
}: PriceCalculationParams): PriceResult {
    const unitPrice = typeof price === "number" ? price : Number(price)
    const originalPrice = unitPrice * quantity

    // Apply personal discount
    const discountMultiplier = (100 - personalDiscount) / 100
    const finalPrice = Math.round(originalPrice * discountMultiplier * 100) / 100
    const discountAmount = Math.round((originalPrice - finalPrice) * 100) / 100

    return {
        unitPrice,
        originalPrice,
        finalPrice,
        discountAmount,
        displayPrice: formatRussianCurrency(finalPrice),
        displayOriginalPrice: formatRussianCurrency(originalPrice),
        hasDiscount: personalDiscount > 0,
    }
}

/**
 * Calculate cart totals
 */
interface CartItem {
    quantity: number
    product: {
        price: Decimal | number
    }
}

interface CartTotals {
    subtotal: number
    discountAmount: number
    total: number
    displaySubtotal: string
    displayDiscount: string
    displayTotal: string
}

export function calculateCartTotals(
    items: CartItem[],
    personalDiscount: number
): CartTotals {
    let subtotal = 0

    for (const item of items) {
        const price = calculatePrice({
            price: item.product.price,
            quantity: Number(item.quantity),
            personalDiscount: 0, // Calculate without discount first for subtotal
        })
        subtotal += price.finalPrice
    }

    const discountMultiplier = (100 - personalDiscount) / 100
    const total = Math.round(subtotal * discountMultiplier * 100) / 100
    const discountAmount = Math.round((subtotal - total) * 100) / 100

    return {
        subtotal,
        discountAmount,
        total,
        displaySubtotal: formatRussianCurrency(subtotal),
        displayDiscount: formatRussianCurrency(discountAmount),
        displayTotal: formatRussianCurrency(total),
    }
}

/**
 * Get price display info for a product (for product cards)
 */
export function getProductPriceDisplay(
    price: Decimal | number
): { price: number; displayPrice: string; priceLabel: string } {
    const normalizedPrice =
        typeof price === "number" ? price : Number(price)

    return {
        price: normalizedPrice,
        displayPrice: formatRussianCurrency(normalizedPrice),
        priceLabel: "Цена",
    }
}
