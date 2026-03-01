import Link from "next/link"
import { ShoppingBag, ArrowRight } from "lucide-react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CartItemsList } from "./cart-items-list"
import { formatRussianCurrency } from "@/lib/utils/format"
import { calculateCartTotals } from "@/lib/utils/price"

async function getCart(userId: string) {
    return prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            images: {
                                where: { isPrimary: true },
                                take: 1,
                            },
                        },
                    },
                },
            },
        },
    })
}

export default async function CartPage() {
    const session = await auth()

    if (!session?.user) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-md mx-auto text-center">
                    <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Корзина пуста</h1>
                    <p className="text-muted-foreground mb-6">
                        Войдите в аккаунт, чтобы добавлять товары в корзину
                    </p>
                    <Link href="/login">
                        <Button>Войти в аккаунт</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const cart = await getCart(session.user.id)

    if (!cart || cart.items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-md mx-auto text-center">
                    <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Корзина пуста</h1>
                    <p className="text-muted-foreground mb-6">
                        Добавьте товары из каталога, чтобы оформить заказ
                    </p>
                    <Link href="/catalog">
                        <Button>Перейти в каталог</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const isWholesale = session.user.isWholesale
    const personalDiscount = session.user.personalDiscount

    // Calculate totals
    const items = cart.items.map((item) => ({
        quantity: Number(item.quantity),
        product: {
            retailPrice: item.product.retailPrice,
            wholesalePrice: item.product.wholesalePrice,
        },
    }))

    const totals = calculateCartTotals(items, isWholesale, personalDiscount)

    // Transform items for component
    const transformedItems = cart.items.map((item) => ({
        id: item.id,
        quantity: Number(item.quantity),
        product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            retailPrice: Number(item.product.retailPrice),
            wholesalePrice: Number(item.product.wholesalePrice),
            unit: item.product.unit,
            stepQuantity: Number(item.product.stepQuantity),
            minOrderQuantity: Number(item.product.minOrderQuantity),
            images: item.product.images.map((img) => ({
                url: img.url,
                alt: img.alt,
            })),
        },
    }))

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Корзина</h1>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Товары ({cart.items.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CartItemsList items={transformedItems} isWholesale={isWholesale} />
                        </CardContent>
                    </Card>
                </div>

                {/* Order Summary */}
                <div>
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle>Итого</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Сумма товаров</span>
                                <span>{totals.displaySubtotal}</span>
                            </div>

                            {totals.discountAmount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Скидка ({personalDiscount}%)</span>
                                    <span>-{totals.displayDiscount}</span>
                                </div>
                            )}

                            <Separator />

                            <div className="flex justify-between text-lg font-bold">
                                <span>К оплате</span>
                                <span className="text-primary">{totals.displayTotal}</span>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Стоимость доставки рассчитывается при оформлении заказа
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Link href="/checkout" className="w-full">
                                <Button className="w-full" size="lg">
                                    Оформить заказ
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export const metadata = {
    title: "Корзина",
}
