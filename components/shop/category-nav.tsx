import Link from "next/link"
import { cn } from "@/lib/utils"

interface Category {
    id: string
    name: string
    slug: string
    imageUrl?: string
}

interface CategoryNavProps {
    categories: Category[]
    activeSlug?: string
    className?: string
}

export function CategoryNav({
    categories,
    activeSlug,
    className,
}: CategoryNavProps) {
    return (
        <nav className={cn("space-y-1", className)}>
            <Link
                href="/catalog"
                className={cn(
                    "block px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    !activeSlug
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                )}
            >
                Все товары
            </Link>
            {categories.map((category) => (
                <Link
                    key={category.id}
                    href={`/catalog/${category.slug}`}
                    className={cn(
                        "block px-4 py-2 rounded-md text-sm font-medium transition-colors",
                        activeSlug === category.slug
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                    )}
                >
                    {category.name}
                </Link>
            ))}
        </nav>
    )
}

// Horizontal category navigation for mobile
export function CategoryNavHorizontal({
    categories,
    activeSlug,
    className,
}: CategoryNavProps) {
    return (
        <nav
            className={cn(
                "flex gap-2 overflow-x-auto pb-2 scrollbar-hide",
                className
            )}
        >
            <Link
                href="/catalog"
                className={cn(
                    "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                    !activeSlug
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-accent"
                )}
            >
                Все
            </Link>
            {categories.map((category) => (
                <Link
                    key={category.id}
                    href={`/catalog/${category.slug}`}
                    className={cn(
                        "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                        activeSlug === category.slug
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-accent"
                    )}
                >
                    {category.name}
                </Link>
            ))}
        </nav>
    )
}
