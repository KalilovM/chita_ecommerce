"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    ShoppingCart,
    Heart,
    AlertTriangle,
    FileText,
    Settings,
    Store,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    {
        title: "Обзор",
        href: "/client",
        icon: LayoutDashboard,
    },
    {
        title: "Заказы",
        href: "/client/orders",
        icon: ShoppingCart,
    },
    {
        title: "Сохранённые списки",
        href: "/client/lists",
        icon: Heart,
    },
    {
        title: "Претензии",
        href: "/client/claims",
        icon: AlertTriangle,
    },
    {
        title: "Документы",
        href: "/client/documents",
        icon: FileText,
    },
    {
        title: "Настройки",
        href: "/client/settings",
        icon: Settings,
    },
]

export function ClientSidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 bg-card border-r min-h-screen relative hidden lg:block">
            <div className="p-6 border-b">
                <Link href="/client" className="flex items-center space-x-2">
                    <Store className="h-6 w-6 text-primary" />
                    <span className="text-lg font-bold">Кабинет клиента</span>
                </Link>
            </div>
            <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/client" && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span>{item.title}</span>
                        </Link>
                    )
                })}
            </nav>
            <div className="absolute bottom-4 left-4 right-4 p-4 bg-muted rounded-lg">
                <Link
                    href="/catalog"
                    className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    <Store className="h-4 w-4" />
                    <span>Перейти в каталог</span>
                </Link>
            </div>
        </aside>
    )
}
