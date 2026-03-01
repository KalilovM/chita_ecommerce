import Link from "next/link"
import { ArrowRight, Truck, Shield, Percent, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProductGrid } from "@/components/shop/product-grid"
import { prisma } from "@/lib/prisma"

async function getHitProducts() {
    return prisma.product.findMany({
        where: {
            isActive: true,
            isHit: true,
        },
        include: {
            images: {
                where: { isPrimary: true },
                take: 1,
            },
        },
        take: 8,
        orderBy: { createdAt: "desc" },
    })
}

async function getNewProducts() {
    return prisma.product.findMany({
        where: {
            isActive: true,
            isNew: true,
        },
        include: {
            images: {
                where: { isPrimary: true },
                take: 1,
            },
        },
        take: 4,
        orderBy: { createdAt: "desc" },
    })
}

async function getCategories() {
    return prisma.category.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { displayOrder: "asc" },
        take: 6,
    })
}

export default async function HomePage() {
    const [hitProducts, newProducts, categories] = await Promise.all([
        getHitProducts(),
        getNewProducts(),
        getCategories(),
    ])

    // Transform products for the component
    const transformProducts = (products: any[]) =>
        products.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            retailPrice: Number(p.retailPrice),
            wholesalePrice: Number(p.wholesalePrice),
            unit: p.unit,
            isHit: p.isHit,
            isNew: p.isNew,
            stockQuantity: Number(p.stockQuantity),
            images: p.images.map((img: any) => ({
                url: img.url,
                alt: img.alt,
            })),
        }))

    return (
        <div>
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900">
                <div className="container mx-auto px-4 py-16 md:py-24">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
                            Свежие овощи и фрукты
                            <span className="text-primary"> с доставкой</span>
                        </h1>
                        <p className="text-lg text-white mb-8">
                            Качественные продукты из Китая по выгодным ценам. Доставляем по
                            всей Чите. Работаем с розничными и оптовыми покупателями.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/catalog">
                                <Button size="lg" className="w-full sm:w-auto">
                                    Перейти в каталог
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/wholesale">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full sm:w-auto"
                                >
                                    Оптовым покупателям
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-12 bg-muted/50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="border-0 shadow-none bg-transparent">
                            <CardContent className="flex flex-col items-center text-center p-4">
                                <Truck className="h-8 w-8 text-primary mb-2" />
                                <h3 className="font-medium">Быстрая доставка</h3>
                                <p className="text-sm text-muted-foreground">
                                    Доставим в день заказа
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-none bg-transparent">
                            <CardContent className="flex flex-col items-center text-center p-4">
                                <Shield className="h-8 w-8 text-primary mb-2" />
                                <h3 className="font-medium">Гарантия качества</h3>
                                <p className="text-sm text-muted-foreground">
                                    Только свежие продукты
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-none bg-transparent">
                            <CardContent className="flex flex-col items-center text-center p-4">
                                <Percent className="h-8 w-8 text-primary mb-2" />
                                <h3 className="font-medium">Оптовые цены</h3>
                                <p className="text-sm text-muted-foreground">
                                    Скидки для оптовиков
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-none bg-transparent">
                            <CardContent className="flex flex-col items-center text-center p-4">
                                <Clock className="h-8 w-8 text-primary mb-2" />
                                <h3 className="font-medium">Удобное время</h3>
                                <p className="text-sm text-muted-foreground">
                                    Выбирайте слот доставки
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Categories */}
            {categories.length > 0 && (
                <section className="py-12">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold">Категории</h2>
                            <Link
                                href="/catalog"
                                className="text-primary hover:underline text-sm font-medium"
                            >
                                Все категории →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {categories.map((category: { id: string; name: string; slug: string }) => (
                                <Link key={category.id} href={`/catalog/${category.slug}`}>
                                    <Card className="group hover:border-primary transition-colors">
                                        <CardContent className="flex flex-col items-center justify-center p-6">
                                            <span className="text-4xl mb-2">
                                                {category.slug === "vegetables"
                                                    ? "🥬"
                                                    : category.slug === "fruits"
                                                        ? "🍎"
                                                        : category.slug === "greens"
                                                            ? "🌿"
                                                            : "📦"}
                                            </span>
                                            <h3 className="font-medium text-center group-hover:text-primary transition-colors">
                                                {category.name}
                                            </h3>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Hit Products */}
            {hitProducts.length > 0 && (
                <section className="py-12 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold">Хиты продаж</h2>
                            <Link
                                href="/catalog?filter=hit"
                                className="text-primary hover:underline text-sm font-medium"
                            >
                                Все хиты →
                            </Link>
                        </div>
                        <ProductGrid products={transformProducts(hitProducts)} />
                    </div>
                </section>
            )}

            {/* New Products */}
            {newProducts.length > 0 && (
                <section className="py-12">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold">Новинки</h2>
                            <Link
                                href="/catalog?filter=new"
                                className="text-primary hover:underline text-sm font-medium"
                            >
                                Все новинки →
                            </Link>
                        </div>
                        <ProductGrid products={transformProducts(newProducts)} />
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className="py-16 bg-primary text-primary-foreground">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">Оптовым покупателям</h2>
                    <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
                        Специальные цены для оптовых клиентов. Персональные скидки,
                        регулярные поставки, индивидуальный подход.
                    </p>
                    <Link href="/wholesale">
                        <Button
                            size="lg"
                            variant="secondary"
                            className="font-semibold"
                        >
                            Узнать подробнее
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    )
}
