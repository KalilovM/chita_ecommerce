"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState, useCallback } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks"

const STATUS_TABS = [
    { key: undefined, label: "Все" },
    { key: "active", label: "Активные" },
    { key: "completed", label: "Завершённые" },
    { key: "cancelled", label: "Отменённые" },
] as const

interface OrdersFilterBarProps {
    currentStatus?: string
    currentSearch?: string
    currentDateFrom?: string
    currentDateTo?: string
}

export function OrdersFilterBar({
    currentStatus,
    currentSearch,
    currentDateFrom,
    currentDateTo,
}: OrdersFilterBarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [search, setSearch] = useState(currentSearch || "")

    const updateParams = useCallback(
        (updates: Record<string, string | undefined>) => {
            const params = new URLSearchParams()
            const merged = {
                status: currentStatus,
                search: currentSearch,
                dateFrom: currentDateFrom,
                dateTo: currentDateTo,
                ...updates,
            }

            for (const [key, value] of Object.entries(merged)) {
                if (value) params.set(key, value)
            }

            router.push(`${pathname}?${params.toString()}`)
        },
        [router, pathname, currentStatus, currentSearch, currentDateFrom, currentDateTo]
    )

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateParams({ search: search || undefined })
    }

    return (
        <div className="space-y-4">
            {/* Status tabs */}
            <div className="flex gap-1 border-b">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.key ?? "all"}
                        onClick={() => updateParams({ status: tab.key })}
                        className={cn(
                            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                            currentStatus === tab.key ||
                                (!currentStatus && tab.key === undefined)
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search + date filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Поиск по номеру заказа..."
                            className="pl-9"
                        />
                    </div>
                    <Button type="submit" variant="outline" size="sm">
                        Найти
                    </Button>
                </form>

                <div className="flex gap-2">
                    <Input
                        type="date"
                        defaultValue={currentDateFrom}
                        onChange={(e) => updateParams({ dateFrom: e.target.value || undefined })}
                        className="w-auto"
                    />
                    <Input
                        type="date"
                        defaultValue={currentDateTo}
                        onChange={(e) => updateParams({ dateTo: e.target.value || undefined })}
                        className="w-auto"
                    />
                </div>
            </div>
        </div>
    )
}
