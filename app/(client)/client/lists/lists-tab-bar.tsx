"use client"

import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface ListsTabBarProps {
    activeTab: string
    favoritesCount: number
    basketsCount: number
}

export function ListsTabBar({ activeTab, favoritesCount, basketsCount }: ListsTabBarProps) {
    const router = useRouter()
    const pathname = usePathname()

    const tabs = [
        { key: "favorites", label: "Избранное", count: favoritesCount },
        { key: "baskets", label: "Сохранённые корзины", count: basketsCount },
    ]

    return (
        <div className="flex gap-1 border-b">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => router.push(`${pathname}?tab=${tab.key}`)}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                        activeTab === tab.key
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    {tab.label} ({tab.count})
                </button>
            ))}
        </div>
    )
}
