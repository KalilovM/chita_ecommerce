import Link from "next/link"
import { ShoppingBag, CircleCheckBig } from "lucide-react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CartItemsList } from "./cart-items-list"
import { CartCheckoutForm } from "./cart-checkout-form"
import {
    FREE_CITY_DELIVERY_THRESHOLD,
    qualifiesForFreeCityDelivery,
} from "@/lib/utils/delivery"
import { formatRussianCurrency } from "@/lib/utils/format"
import { calculateCartTotals } from "@/lib/utils/price"
import { getCart } from "@/actions/cart"

interface CartPageProps {
    searchParams: Promise<{ success?: string }>
}

export default async function CartPage({ searchParams }: CartPageProps) {
    const session = await auth()
    const params = await searchParams
    const [cart, profileUser, defaultAddress] = await Promise.all([
        getCart(),
        session?.user?.id
            ? prisma.user.findUnique({
                where: { id: session.user.id },
                select: {
                    name: true,
                    email: true,
                    phone: true,
                    personalDiscount: true,
                },
            })
            : Promise.resolve(null),
        session?.user?.id
            ? prisma.address.findFirst({
                where: {
                    userId: session.user.id,
                },
                select: {
                    id: true,
                    fullAddress: true,
                },
                orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
            })
            : Promise.resolve(null),
    ])

    if (!cart || cart.items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-md mx-auto text-center">
                    {params.success ? (
                        <CircleCheckBig className="h-16 w-16 mx-auto text-green-600 mb-4" />
                    ) : (
                        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    )}
                    <h1 className="text-2xl font-bold mb-2">
                        {params.success ? "Заявка отправлена" : "Корзина пуста"}
                    </h1>
                    <p className="text-muted-foreground mb-6">
                        {params.success
                            ? `Заявка ${params.success} создана. Мы свяжемся с вами по телефону для подтверждения деталей.`
                            : "Добавьте товары из каталога, чтобы оформить заявку"}
                    </p>
                    <Link href="/catalog">
                        <Button>{params.success ? "Вернуться в каталог" : "Перейти в каталог"}</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const personalDiscount = Number(profileUser?.personalDiscount || 0)

    // Calculate totals
    const items = cart.items.map((item) => ({
        quantity: Number(item.quantity),
        product: {
            price: item.product.price,
        },
    }))

    const totals = calculateCartTotals(items, Number(personalDiscount))
    const hasFreeCityDelivery = qualifiesForFreeCityDelivery(totals.total)

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
                            <CartItemsList />
                        </CardContent>
                    </Card>
                </div>

                {/* Order Summary */}
                <div>
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle>Заявка на поставку</CardTitle>
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
                                <span>Предварительная сумма</span>
                                <span className="text-primary">{totals.displayTotal}</span>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Финальные условия, адрес и время доставки подтверждаются по телефону.
                            </p>

                            <div
                                className={`rounded-lg border p-3 text-xs ${
                                    hasFreeCityDelivery
                                        ? "border-green-200 bg-green-50 text-green-700"
                                        : "border-border bg-muted/30 text-muted-foreground"
                                }`}
                            >
                                {hasFreeCityDelivery
                                    ? "Для этой корзины действует бесплатная доставка по Чите."
                                    : `Бесплатная доставка по Чите действует при заказе свыше ${formatRussianCurrency(FREE_CITY_DELIVERY_THRESHOLD)}. За пределами города заявки оформляются через менеджера.`}
                            </div>

                            <Separator />

                            <CartCheckoutForm
                                isAuthenticated={!!session?.user}
                                user={
                                    profileUser
                                        ? {
                                            name: profileUser.name,
                                            email: profileUser.email,
                                            phone: profileUser.phone,
                                        }
                                        : null
                                }
                                defaultAddress={defaultAddress}
                                orderTotal={totals.total}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export const metadata = {
    title: "Корзина",
}
