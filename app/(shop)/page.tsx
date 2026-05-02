import Link from "next/link"
import {
    ArrowRight,
    Truck,
    Shield,
    Clock,
    Building2,
    Boxes,
    BadgeCheck,
    PhoneCall,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

    const transformProducts = (products: any[]) =>
        products.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number(p.price),
            unit: p.unit,
            packagingType: p.packagingType,
            packagingQuantity: p.packagingQuantity ? Number(p.packagingQuantity) : null,
            packagingUnit: p.packagingUnit,
            stepQuantity: Number(p.stepQuantity),
            minOrderQuantity: Number(p.minOrderQuantity),
            isHit: p.isHit,
            isNew: p.isNew,
            images: p.images.map((img: any) => ({
                url: img.url,
                alt: img.alt,
            })),
        }))

    const partnerHighlights = [
        {
            title: "Для бизнеса",
            description: "Магазины, кафе, рестораны и корпоративные закупки.",
            icon: Building2,
        },
        {
            title: "Регулярные поставки",
            description: "Собираем повторяемые заказы и держим удобный ритм поставок.",
            icon: Truck,
        },
        {
            title: "Проверенный ассортимент",
            description: "Популярные позиции, сезонные новинки и стабильное качество.",
            icon: BadgeCheck,
        },
        {
            title: "Быстрое согласование",
            description: "Уточняем состав заказа напрямую и подтверждаем поставку без лишних шагов.",
            icon: PhoneCall,
        },
    ]

    const workflow = [
        "Вы выбираете позиции из каталога и отправляете корзину.",
        "Мы подтверждаем наличие, объём, логистику и финальные детали заказа.",
        "Привозим поставку в согласованное окно и остаёмся на связи по следующим закупкам.",
    ]

    return (
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(22,163,74,0.14),transparent_35%),linear-gradient(180deg,#fbfdf9_0%,#f3f8ef_100%)]">
            <section className="border-b border-border/60">
                <div className="container mx-auto px-4 py-16 md:py-24">
                    <div className="grid gap-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm text-emerald-700 shadow-sm">
                                <BadgeCheck className="h-4 w-4" />
                                Оптовая платформа для закупок свежей продукции
                            </div>
                            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
                                Овощи и фрукты для бизнеса в Чите
                            </h1>
                            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                                Работаем только с оптовыми покупателями: магазинами, кафе,
                                ресторанами и корпоративными клиентами. Каталог показывает
                                актуальный ассортимент, а финальные объёмы и поставку мы
                                подтверждаем напрямую с вами.
                            </p>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link href="/catalog">
                                    <Button size="lg" className="w-full sm:w-auto">
                                        Смотреть ассортимент
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                                        Подключить компанию
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <Card className="border-emerald-100 bg-white/90 shadow-xl shadow-emerald-100/60">
                            <CardHeader>
                                <CardTitle>Почему закупают через нас</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-xl bg-emerald-50 p-4">
                                    <p className="text-3xl font-bold text-emerald-700">24 ч</p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        На подтверждение и подготовку поставки по Чите
                                    </p>
                                </div>
                                <div className="rounded-xl bg-amber-50 p-4">
                                    <p className="text-3xl font-bold text-amber-700">1 кабинет</p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Для повторных заказов, адресов и документов
                                    </p>
                                </div>
                                <div className="rounded-xl bg-sky-50 p-4">
                                    <p className="text-3xl font-bold text-sky-700">4 шага</p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        От выбора товара до подтверждённой поставки
                                    </p>
                                </div>
                                <div className="rounded-xl bg-slate-100 p-4">
                                    <p className="text-3xl font-bold text-slate-800">B2B</p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Ориентированы только на оптовые закупки
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {partnerHighlights.map((item) => (
                            <Card key={item.title} className="border-white/70 bg-white/80 shadow-sm">
                                <CardContent className="p-5">
                                    <item.icon className="h-7 w-7 text-emerald-600" />
                                    <h2 className="mt-4 font-semibold text-slate-900">{item.title}</h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        {item.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {categories.length > 0 && (
                <section className="py-12">
                    <div className="container mx-auto px-4">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-700">
                                    Ассортимент
                                </p>
                                <h2 className="mt-2 text-2xl font-bold">Основные товарные группы</h2>
                            </div>
                            <Link
                                href="/catalog"
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                Весь каталог →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                            {categories.map((category: { id: string; name: string; slug: string }) => (
                                <Link key={category.id} href={`/catalog/${category.slug}`}>
                                    <Card className="group h-full border-white/70 bg-white/85 transition-transform hover:-translate-y-1 hover:border-emerald-200">
                                        <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                                            <span className="text-4xl">
                                                {category.slug === "vegetables"
                                                    ? "🥬"
                                                    : category.slug === "fruits"
                                                        ? "🍎"
                                                        : category.slug === "greens"
                                                            ? "🌿"
                                                            : "📦"}
                                            </span>
                                            <h3 className="mt-3 font-medium text-slate-900 group-hover:text-primary">
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

            {hitProducts.length > 0 && (
                <section className="py-12">
                    <div className="container mx-auto px-4">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-700">
                                    Популярные позиции
                                </p>
                                <h2 className="mt-2 text-2xl font-bold">Часто заказывают оптом</h2>
                            </div>
                            <Link
                                href="/catalog?filter=hit"
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                Все хиты →
                            </Link>
                        </div>
                        <ProductGrid products={transformProducts(hitProducts)} />
                    </div>
                </section>
            )}

            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
                        <Card className="border-white/70 bg-slate-900 text-white shadow-xl">
                            <CardContent className="p-8">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-white/80">
                                    <Boxes className="h-4 w-4" />
                                    Как строится поставка
                                </div>
                                <h2 className="mt-4 text-3xl font-bold">
                                    Закупка без лишней переписки и ручных таблиц
                                </h2>
                                <div className="mt-8 space-y-6">
                                    {workflow.map((step, index) => (
                                        <div key={step} className="flex gap-4">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-semibold text-white">
                                                {index + 1}
                                            </div>
                                            <p className="pt-1 text-white/80">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {newProducts.length > 0 && (
                            <div>
                                <div className="mb-6">
                                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-700">
                                        Новые поступления
                                    </p>
                                    <h2 className="mt-2 text-2xl font-bold">Свежие позиции в каталоге</h2>
                                </div>
                                <ProductGrid products={transformProducts(newProducts)} className="lg:grid-cols-2" />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="mb-8 max-w-2xl">
                        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-700">
                            Стандарты сервиса
                        </p>
                        <h2 className="mt-2 text-2xl font-bold">Что важно для оптовых закупок</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="bg-white/85">
                            <CardContent className="p-6">
                                <Truck className="h-8 w-8 text-primary" />
                                <h3 className="mt-4 font-semibold">Поставка по графику</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Подстраиваем отгрузку под рабочее окно магазина, кухни или склада.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white/85">
                            <CardContent className="p-6">
                                <Shield className="h-8 w-8 text-primary" />
                                <h3 className="mt-4 font-semibold">Контроль качества</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Отбираем позиции под бизнес-задачи и фиксируем ожидания по качеству.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white/85">
                            <CardContent className="p-6">
                                <Clock className="h-8 w-8 text-primary" />
                                <h3 className="mt-4 font-semibold">Быстрый повторный заказ</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Один раз собираете рабочую корзину, дальше повторяете закупки быстрее.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-4 text-center">
                    <div className="rounded-3xl bg-emerald-600 px-6 py-12 text-primary-foreground shadow-2xl shadow-emerald-200/70 md:px-12">
                        <h2 className="text-3xl font-bold">Подключите компанию к каталогу закупок</h2>
                        <p className="mx-auto mt-4 max-w-2xl text-lg opacity-90">
                            Зарегистрируйте кабинет, соберите первую корзину и согласуйте
                            поставку с менеджером. Платформа заточена под повторные B2B-заказы,
                            а не под розничные покупки.
                        </p>
                        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                            <Link href="/register">
                                <Button size="lg" variant="secondary">
                                    Стать партнёром
                                </Button>
                            </Link>
                            <Link href="/catalog">
                                <Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                                    Изучить каталог
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
