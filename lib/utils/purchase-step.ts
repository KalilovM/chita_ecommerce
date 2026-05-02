const DEFAULT_PURCHASE_STEP = 1
const QUANTITY_PRECISION = 3
const STEP_EPSILON = 1e-6

export function roundQuantity(value: number) {
    return Number(value.toFixed(QUANTITY_PRECISION))
}

export function resolvePurchaseStep(packagingQuantity: number | null | undefined) {
    if (!Number.isFinite(packagingQuantity) || !packagingQuantity || packagingQuantity <= 0) {
        return DEFAULT_PURCHASE_STEP
    }

    const normalizedStep = roundQuantity(packagingQuantity)
    if (normalizedStep <= 0) {
        return DEFAULT_PURCHASE_STEP
    }

    return normalizedStep
}

export function isQuantityStepAligned(quantity: number, step: number) {
    if (!Number.isFinite(quantity) || quantity <= 0) {
        return false
    }

    const safeStep = resolvePurchaseStep(step)
    const ratio = quantity / safeStep

    return Math.abs(ratio - Math.round(ratio)) < STEP_EPSILON
}

export function nextQuantityByStep(quantity: number, step: number) {
    const safeStep = resolvePurchaseStep(step)

    if (!Number.isFinite(quantity) || quantity < safeStep) {
        return safeStep
    }

    if (!isQuantityStepAligned(quantity, safeStep)) {
        return roundQuantity(Math.ceil(quantity / safeStep) * safeStep)
    }

    return roundQuantity(quantity + safeStep)
}

export function previousQuantityByStep(quantity: number, step: number) {
    const safeStep = resolvePurchaseStep(step)

    if (!Number.isFinite(quantity) || quantity <= safeStep) {
        return safeStep
    }

    if (!isQuantityStepAligned(quantity, safeStep)) {
        return roundQuantity(Math.max(safeStep, Math.floor(quantity / safeStep) * safeStep))
    }

    return roundQuantity(Math.max(safeStep, quantity - safeStep))
}
