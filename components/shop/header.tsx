"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, User, Menu, Search, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/hooks/use-cart"

interface Category {
    id: string
    name: string
    slug: string
}

interface HeaderProps {
    user?: {
        name: string
        role: string
    } | null
    categories?: Category[]
}

export function Header({ user, categories = [] }: HeaderProps) {
    const router = useRouter()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const { itemCount } = useCart()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`)
            setIsSearchOpen(false)
            setSearchQuery("")
        }
    }

    // Show first 4 categories in navigation
    const navCategories = categories.slice(0, 4)

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-2xl">🥬</span>
                        <span className="text-xl font-bold text-primary">
                            СвежиеОвощи
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-6">
                        <Link
                            href="/catalog"
                            className="text-sm font-medium transition-colors hover:text-primary"
                        >
                            Каталог
                        </Link>
                        {navCategories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/catalog/${category.slug}`}
                                className="text-sm font-medium transition-colors hover:text-primary"
                            >
                                {category.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Search - Desktop */}
                    <div className="hidden md:flex flex-1 max-w-md mx-4">
                        <form onSubmit={handleSearch} className="relative w-full">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Поиск товаров..."
                                className="pl-9 pr-4"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Search toggle - Mobile */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                        >
                            {isSearchOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Search className="h-5 w-5" />
                            )}
                        </Button>

                        {/* Cart */}
                        <Link href="/cart">
                            <Button variant="ghost" size="icon" className="relative">
                                <ShoppingCart className="h-5 w-5" />
                                {itemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs font-medium text-primary-foreground flex items-center justify-center">
                                        {itemCount > 99 ? "99+" : itemCount}
                                    </span>
                                )}
                            </Button>
                        </Link>

                        {/* User */}
                        {user ? (
                            <Link href="/profile">
                                <Button variant="ghost" size="icon">
                                    <User className="h-5 w-5" />
                                </Button>
                            </Link>
                        ) : (
                            <Link href="/login">
                                <Button variant="outline" size="sm">
                                    Войти
                                </Button>
                            </Link>
                        )}

                        {/* Admin Link */}
                        {user?.role === "ADMIN" && (
                            <Link href="/admin">
                                <Button variant="outline" size="sm">
                                    Админ
                                </Button>
                            </Link>
                        )}

                        {/* Mobile menu toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Mobile Search */}
                {isSearchOpen && (
                    <div className="pb-4 md:hidden">
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Поиск товаров..."
                                className="pl-9 pr-4"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </form>
                    </div>
                )}

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <nav className="pb-4 md:hidden">
                        <div className="flex flex-col space-y-2">
                            <Link
                                href="/catalog"
                                className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Каталог
                            </Link>
                            {categories.map((category) => (
                                <Link
                                    key={category.id}
                                    href={`/catalog/${category.slug}`}
                                    className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {category.name}
                                </Link>
                            ))}
                        </div>
                    </nav>
                )}
            </div>
        </header>
    )
}
