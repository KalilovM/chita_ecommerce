"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Store, LogOut } from "lucide-react"
import { useState } from "react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    ShoppingCart,
    Heart,
    AlertTriangle,
    FileText,
    Settings,
} from "lucide-react"

const navItems = [
    { title: "Обзор", href: "/client", icon: LayoutDashboard },
    { title: "Заказы", href: "/client/orders", icon: ShoppingCart },
    { title: "Списки", href: "/client/lists", icon: Heart },
    { title: "Претензии", href: "/client/claims", icon: AlertTriangle },
    { title: "Документы", href: "/client/documents", icon: FileText },
    { title: "Настройки", href: "/client/settings", icon: Settings },
]

interface ClientHeaderProps {
    userName: string
    companyName?: string | null
}

export function ClientHeader({ userName, companyName }: ClientHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const pathname = usePathname()

    return (
        <header className="border-b bg-card">
            <div className="flex items-center justify-between px-4 py-3 lg:px-6">
                {/* Mobile menu toggle */}
                <button
                    className="lg:hidden p-2 rounded-md hover:bg-accent"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>

                {/* User info */}
                <div className="flex-1 lg:flex-none">
                    <p className="text-sm font-medium">{userName}</p>
                    {companyName && (
                        <p className="text-xs text-muted-foreground">{companyName}</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                    <Link href="/catalog">
                        <Button variant="outline" size="sm">
                            <Store className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Каталог</span>
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Mobile nav */}
            {mobileMenuOpen && (
                <nav className="lg:hidden border-t px-4 py-2 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/client" && pathname.startsWith(item.href))
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
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
            )}
        </header>
    )
}
