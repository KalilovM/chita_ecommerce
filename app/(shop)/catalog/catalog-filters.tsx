"use client"

import { useRouter, useSearchParams } from "next/navigation"

interface CatalogFiltersProps {
    totalProducts: number
    currentSort?: string
    currentSearch?: string
}

export function CatalogFilters({
    totalProducts,
    currentSort,
    currentSearch,
}: CatalogFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleSortChange = (sort: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (sort) {
            params.set("sort", sort)
        } else {
            params.delete("sort")
        }
        router.push(`/catalog?${params.toString()}`)
    }

    const handleClearSearch = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("search")
        router.push(`/catalog?${params.toString()}`)
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                    {totalProducts} товаров
                </p>
                {currentSearch && (
                    <button
                        onClick={handleClearSearch}
                        className="text-sm text-primary hover:underline"
                    >
                        Сбросить поиск
                    </button>
                )}
            </div>
            <select
                value={currentSort || ""}
                onChange={(e) => handleSortChange(e.target.value)}
                className="text-sm border rounded-md px-3 py-2 bg-background"
            >
                <option value="">По умолчанию</option>
                <option value="price-asc">Сначала дешевые</option>
                <option value="price-desc">Сначала дорогие</option>
                <option value="name">По названию</option>
            </select>
        </div>
    )
}
