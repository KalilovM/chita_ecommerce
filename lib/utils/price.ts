import { Decimal } from "@prisma/client/runtime/library"
import { formatRussianCurrency } from "./format"

interface PriceCalculationParams {
    retailPrice: Decimal | number
    wholesalePrice: Decimal | number
    quantity: number
    isWholesale: boolean
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
 * Calculate price with wholesale and personal discount logic
 */
export function calculatePrice({
    retailPrice,
    wholesalePrice,
    quantity,
    isWholesale,
    personalDiscount,
}: PriceCalculationParams): PriceResult {
    // Convert Decimals to numbers
    const retail = typeof retailPrice === "number"
        ? retailPrice
        : Number(retailPrice)
    const wholesale = typeof wholesalePrice === "number"
        ? wholesalePrice
        : Number(wholesalePrice)

    // Determine base price
    const unitPrice = isWholesale ? wholesale : retail
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
        retailPrice: Decimal | number
        wholesalePrice: Decimal | number
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
    isWholesale: boolean,
    personalDiscount: number
): CartTotals {
    let subtotal = 0

    for (const item of items) {
        const price = calculatePrice({
            retailPrice: item.product.retailPrice,
            wholesalePrice: item.product.wholesalePrice,
            quantity: Number(item.quantity),
            isWholesale,
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
    retailPrice: Decimal | number,
    wholesalePrice: Decimal | number,
    isWholesale: boolean
): { price: number; displayPrice: string; priceLabel: string } {
    const price = isWholesale
        ? (typeof wholesalePrice === "number" ? wholesalePrice : Number(wholesalePrice))
        : (typeof retailPrice === "number" ? retailPrice : Number(retailPrice))

    return {
        price,
        displayPrice: formatRussianCurrency(price),
        priceLabel: isWholesale ? "Оптовая цена" : "Розничная цена",
    }
}
