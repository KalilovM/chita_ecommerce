"use client"

import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
    nextQuantityByStep,
    previousQuantityByStep,
    roundQuantity,
    resolvePurchaseStep,
} from "@/lib/utils/purchase-step"

interface QuantitySelectorProps {
    value: number
    min?: number
    max?: number
    step?: number
    unit?: string
    onChange: (value: number) => void
    disabled?: boolean
    className?: string
}

export function QuantitySelector({
    value,
    min = 1,
    max = 999,
    step = 1,
    unit = "шт",
    onChange,
    disabled = false,
    className,
}: QuantitySelectorProps) {
    const safeStep = resolvePurchaseStep(step)
    const decimalPlaces = Math.max(
        0,
        Math.min(
            3,
            safeStep.toString().includes(".")
                ? safeStep.toString().split(".")[1]?.length ?? 0
                : 0
        )
    )

    const handleIncrement = () => {
        const steppedValue = nextQuantityByStep(value, safeStep)
        const clampedValue = Math.max(min, Math.min(steppedValue, max))
        onChange(roundQuantity(clampedValue))
    }

    const handleDecrement = () => {
        const steppedValue = previousQuantityByStep(value, safeStep)
        const clampedValue = Math.max(min, Math.min(steppedValue, max))
        onChange(roundQuantity(clampedValue))
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = parseFloat(e.target.value)
        if (!isNaN(inputValue)) {
            const clampedValue = Math.max(min, Math.min(inputValue, max))
            const alignedSteps = Math.round((clampedValue - min) / safeStep)
            const alignedValue = min + Math.max(0, alignedSteps) * safeStep
            onChange(roundQuantity(Math.max(min, Math.min(alignedValue, max))))
        }
    }

    const formatValue = (val: number) => {
        if (decimalPlaces > 0) {
            return val.toFixed(decimalPlaces)
        }

        return val.toString()
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Button
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                disabled={disabled || value <= min}
                className="h-10 w-10"
            >
                <Minus className="h-4 w-4" />
            </Button>

            <div className="relative">
                <Input
                    type="number"
                    value={formatValue(value)}
                    onChange={handleInputChange}
                    disabled={disabled}
                    className="w-20 text-center pr-8"
                    min={min}
                    max={max}
                    step={safeStep}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {unit}
                </span>
            </div>

            <Button
                variant="outline"
                size="icon"
                onClick={handleIncrement}
                disabled={disabled || value >= max}
                className="h-10 w-10"
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    )
}
