import { ProductCard, ProductCardSkeleton } from "./product-card"
import { cn } from "@/lib/utils"

interface Product {
    id: string
    name: string
    slug: string
    retailPrice: number
    wholesalePrice: number
    unit: string
    isHit?: boolean
    isNew?: boolean
    stockQuantity: number
    images?: { url: string; alt?: string }[]
}

interface ProductGridProps {
    products: Product[]
    isWholesale?: boolean
    onAddToCart?: (productId: string, quantity: number) => void
    className?: string
}

export function ProductGrid({
    products,
    isWholesale = false,
    onAddToCart,
    className,
}: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Товары не найдены</p>
            </div>
        )
    }

    return (
        <div
            className={cn(
                "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
                className
            )}
        >
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    isWholesale={isWholesale}
                    onAddToCart={onAddToCart}
                />
            ))}
        </div>
    )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    )
}
