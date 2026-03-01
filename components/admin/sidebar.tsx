"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Package,
    FolderTree,
    Users,
    ShoppingCart,
    Settings,
    Truck,
    Store,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    {
        title: "Панель управления",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Товары",
        href: "/admin/products",
        icon: Package,
    },
    {
        title: "Категории",
        href: "/admin/categories",
        icon: FolderTree,
    },
    {
        title: "Заказы",
        href: "/admin/orders",
        icon: ShoppingCart,
    },
    {
        title: "Клиенты",
        href: "/admin/clients",
        icon: Users,
    },
    {
        title: "Зоны доставки",
        href: "/admin/delivery-zones",
        icon: Truck,
    },
    {
        title: "Настройки сайта",
        href: "/admin/settings",
        icon: Settings,
    },
]

export function AdminSidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 bg-card border-r min-h-screen relative">
            <div className="p-6 border-b">
                <Link href="/admin" className="flex items-center space-x-2">
                    <Store className="h-6 w-6 text-primary" />
                    <span className="text-lg font-bold">Админ-панель</span>
                </Link>
            </div>
            <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/admin" && pathname.startsWith(item.href))
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
                    href="/"
                    className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    <Store className="h-4 w-4" />
                    <span>Перейти на сайт</span>
                </Link>
            </div>
        </aside>
    )
}
