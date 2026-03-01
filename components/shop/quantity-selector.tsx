"use client"

import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

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
    const handleIncrement = () => {
        const newValue = Math.min(value + step, max)
        onChange(Number(newValue.toFixed(3)))
    }

    const handleDecrement = () => {
        const newValue = Math.max(value - step, min)
        onChange(Number(newValue.toFixed(3)))
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = parseFloat(e.target.value)
        if (!isNaN(inputValue)) {
            const clampedValue = Math.max(min, Math.min(inputValue, max))
            onChange(Number(clampedValue.toFixed(3)))
        }
    }

    const formatValue = (val: number) => {
        if (step < 1) {
            return val.toFixed(1)
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
                    step={step}
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
