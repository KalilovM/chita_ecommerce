"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { CheckoutSchema } from "@/lib/validators/order"
import { generateOrderNumber } from "@/lib/utils/order-number"
import { calculateDeliveryCost, getFinalDeliveryCost } from "@/lib/utils/delivery"
import { calculateCartTotals } from "@/lib/utils/price"
import type { UnitType } from "@prisma/client"

export async function createOrder(formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const rawData = {
        addressId: formData.get("addressId") as string,
        deliveryDate: formData.get("deliveryDate") as string,
        deliveryTimeSlot: formData.get("deliveryTimeSlot") as string,
        paymentMethod: formData.get("paymentMethod") as string,
        notes: formData.get("notes") as string | undefined,
    }

    // Validate
    const validation = CheckoutSchema.safeParse(rawData)
    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const data = validation.data

    try {
        // Get cart
        const cart = await prisma.cart.findUnique({
            where: { userId: session.user.id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        })

        if (!cart || cart.items.length === 0) {
            return { error: "Корзина пуста" }
        }

        // Get address
        const address = await prisma.address.findFirst({
            where: {
                id: data.addressId,
                userId: session.user.id,
            },
        })

        if (!address) {
            return { error: "Адрес не найден" }
        }

        // Get user for discount info
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        })

        if (!user) {
            return { error: "Пользователь не найден" }
        }

        // Calculate cart totals
        const cartItems = cart.items.map((item: { quantity: unknown; product: { retailPrice: unknown; wholesalePrice: unknown } }) => ({
            quantity: Number(item.quantity),
            product: {
                retailPrice: Number(item.product.retailPrice),
                wholesalePrice: Number(item.product.wholesalePrice),
            },
        }))

        const cartTotals = calculateCartTotals(
            cartItems,
            user.isWholesale,
            Number(user.personalDiscount)
        )

        // Calculate delivery cost
        const deliveryResult = await calculateDeliveryCost([
            Number(address.longitude),
            Number(address.latitude),
        ])

        const finalDelivery = getFinalDeliveryCost(
            deliveryResult.deliveryCost,
            cartTotals.total,
            deliveryResult.freeDeliveryThreshold
        )

        // Check minimum order amount
        if (cartTotals.total < deliveryResult.minOrderAmount) {
            return {
                error: `Минимальная сумма заказа для доставки: ${deliveryResult.displayMinOrder}`,
            }
        }

        // Generate order number
        const orderNumber = await generateOrderNumber()

        // Create order
        const order = await prisma.order.create({
            data: {
                orderNumber,
                userId: session.user.id,
                addressId: address.id,
                status: "PENDING",
                paymentStatus: "PENDING",
                subtotal: cartTotals.subtotal,
                discountAmount: cartTotals.discountAmount,
                discountPercent: user.personalDiscount,
                deliveryCost: finalDelivery.cost,
                totalAmount: cartTotals.total + finalDelivery.cost,
                customerName: user.name,
                customerPhone: user.phone || "",
                customerEmail: user.email,
                deliveryDate: new Date(data.deliveryDate),
                deliveryTimeSlot: data.deliveryTimeSlot,
                deliveryNotes: data.notes,
                deliveryAddress: address.fullAddress,
                paymentMethod: data.paymentMethod,
                items: {
                    create: cart.items.map((item: { quantity: unknown; product: { id: string; name: string; unit: string; wholesalePrice: unknown; retailPrice: unknown } }) => ({
                        product: { connect: { id: item.product.id } },
                        productName: item.product.name,
                        quantity: Number(item.quantity),
                        unit: item.product.unit as UnitType,
                        unitPrice: Number(
                            user.isWholesale
                                ? item.product.wholesalePrice
                                : item.product.retailPrice
                        ),
                        totalPrice:
                            Number(item.quantity) *
                            Number(
                                user.isWholesale
                                    ? item.product.wholesalePrice
                                    : item.product.retailPrice
                            ),
                    })),
                },
                statusHistory: {
                    create: {
                        status: "PENDING",
                        note: "Заказ создан",
                    },
                },
            },
        })

        // Clear cart
        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
        })

        revalidatePath("/")
        revalidatePath("/cart")
        revalidatePath("/profile/orders")

        return { success: true, orderId: order.id, orderNumber: order.orderNumber }
    } catch (error) {
        console.error("Create order error:", error)
        return { error: "Ошибка при создании заказа" }
    }
}

export async function getOrders() {
    const session = await auth()

    if (!session?.user) {
        return []
    }

    try {
        const orders = await prisma.order.findMany({
            where: { userId: session.user.id },
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
            orderBy: { createdAt: "desc" },
        })

        return orders
    } catch (error) {
        console.error("Get orders error:", error)
        return []
    }
}

export async function getOrderById(orderId: string) {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    try {
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: session.user.id,
            },
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
                address: true,
                statusHistory: {
                    orderBy: { createdAt: "desc" },
                },
            },
        })

        return order
    } catch (error) {
        console.error("Get order error:", error)
        return null
    }
}
