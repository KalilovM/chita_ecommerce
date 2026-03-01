/**
 * Russian locale formatting utilities
 */

/**
 * Format number as Russian currency (rubles)
 */
export function formatRussianCurrency(amount: number): string {
    return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)
}

/**
 * Format date in Russian locale
 */
export function formatRussianDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date
    return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(d)
}

/**
 * Format date with time in Russian locale
 */
export function formatRussianDateTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date
    return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d)
}

/**
 * Format phone number to Russian format +7 (XXX) XXX-XX-XX
 */
export function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, "")
    const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})$/)
    if (match) {
        return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}-${match[5]}`
    }
    return phone
}

/**
 * Format weight with unit
 */
export function formatWeight(weight: number, unit: string = "кг"): string {
    if (weight < 1) {
        return `${Math.round(weight * 1000)} г`
    }
    return `${weight.toFixed(weight % 1 === 0 ? 0 : 1)} ${unit}`
}

/**
 * Get unit label in Russian
 */
export function getUnitLabel(unit: string, quantity: number = 1): string {
    const units: Record<string, { one: string; few: string; many: string }> = {
        KG: { one: "кг", few: "кг", many: "кг" },
        PIECE: { one: "шт", few: "шт", many: "шт" },
        BOX: { one: "коробка", few: "коробки", many: "коробок" },
        BUNCH: { one: "пучок", few: "пучка", many: "пучков" },
    }

    const unitData = units[unit] || units.KG

    // Russian pluralization rules
    const n = Math.abs(quantity) % 100
    const n1 = n % 10

    if (n > 10 && n < 20) return unitData.many
    if (n1 > 1 && n1 < 5) return unitData.few
    if (n1 === 1) return unitData.one
    return unitData.many
}

/**
 * Format quantity with appropriate unit
 */
export function formatQuantity(quantity: number, unit: string): string {
    const label = getUnitLabel(unit, quantity)

    if (unit === "KG") {
        return formatWeight(quantity)
    }

    return `${quantity} ${label}`
}
