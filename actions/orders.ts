"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { CheckoutSchema } from "@/lib/validators/order"
import { isWithinCity } from "@/lib/utils/delivery"
import { generateOrderNumber } from "@/lib/utils/order-number"
import { calculateCartTotals } from "@/lib/utils/price"
import type { UnitType } from "@prisma/client"

const GUEST_CART_COOKIE = "guest_cart_id"
const DEFAULT_CITY = "Чита"
const DEFAULT_LATITUDE = 52.0515
const DEFAULT_LONGITUDE = 113.4712

interface CheckoutInput {
    customerName?: string
    customerPhone?: string
    customerEmail?: string
    addressId?: string
    deliveryArea?: "CITY" | "OUTSIDE_CITY"
    deliveryAddress?: string
    notes?: string
}

async function getCurrentCart(userId?: string) {
    if (userId) {
        return prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        })
    }

    const cookieStore = await cookies()
    const guestCartId = cookieStore.get(GUEST_CART_COOKIE)?.value

    if (!guestCartId) {
        return null
    }

    return prisma.cart.findUnique({
        where: { sessionId: guestCartId },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
    })
}

async function findOrCreateOrderUser(data: {
    customerName: string
    customerPhone: string
    customerEmail?: string
}) {
    const normalizedEmail = data.customerEmail?.trim().toLowerCase() || undefined
    const normalizedPhone = data.customerPhone.trim()

    let user = normalizedEmail
        ? await prisma.user.findUnique({ where: { email: normalizedEmail } })
        : null

    if (!user) {
        user = await prisma.user.findUnique({
            where: { phone: normalizedPhone },
        })
    }

    if (user) {
        const updateData: {
            name?: string
            phone?: string
            isWholesale?: boolean
            role?: "WHOLESALE"
        } = {}

        if (user.name !== data.customerName) {
            updateData.name = data.customerName
        }
        if (!user.phone) {
            updateData.phone = normalizedPhone
        }
        if (!user.isWholesale) {
            updateData.isWholesale = true
            updateData.role = "WHOLESALE"
        }

        if (Object.keys(updateData).length > 0) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: updateData,
            })
        }

        return user
    }

    return prisma.user.create({
        data: {
            email:
                normalizedEmail ||
                `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@order.local`,
            name: data.customerName,
            phone: normalizedPhone,
            role: "WHOLESALE",
            isWholesale: true,
        },
    })
}

async function resolveOrderAddress(userId: string, data: CheckoutInput) {
    if (data.addressId) {
        const selectedAddress = await prisma.address.findFirst({
            where: {
                id: data.addressId,
                userId,
            },
        })

        if (selectedAddress) {
            return selectedAddress
        }
    }

    const defaultAddress = await prisma.address.findFirst({
        where: {
            userId,
        },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    })

    if (defaultAddress && !data.deliveryAddress) {
        return defaultAddress
    }

    if (!data.deliveryAddress) {
        return null
    }

    const hasExistingAddresses = await prisma.address.count({
        where: { userId },
    })

    return prisma.address.create({
        data: {
            userId,
            label: hasExistingAddresses === 0 ? "Основной" : "Новый адрес",
            fullAddress: data.deliveryAddress,
            city: DEFAULT_CITY,
            street: data.deliveryAddress,
            building: "уточнить",
            latitude: DEFAULT_LATITUDE,
            longitude: DEFAULT_LONGITUDE,
            isDefault: hasExistingAddresses === 0,
        },
    })
}

export async function createOrder(rawData: CheckoutInput) {
    const session = await auth()

    // Validate
    const validation = CheckoutSchema.safeParse(rawData)
    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    const data = validation.data

    try {
        const cart = await getCurrentCart(session?.user?.id)

        if (!cart || cart.items.length === 0) {
            return { error: "Корзина пуста" }
        }

        const user = session?.user
            ? await prisma.user.findUnique({
                where: { id: session.user.id },
            })
            : null

        const customerName = data.customerName?.trim() || user?.name || ""
        const customerPhone = data.customerPhone?.trim() || user?.phone || ""
        const customerEmail =
            data.customerEmail?.trim().toLowerCase() || user?.email || undefined

        if (!customerName) {
            return { error: "Укажите имя или контактное лицо" }
        }

        if (!customerPhone) {
            return { error: "Укажите номер телефона для связи" }
        }

        const orderUser = user
            ? user
            : await findOrCreateOrderUser({
                customerName,
                customerPhone,
                customerEmail,
            })

        if (!orderUser) {
            return { error: "Не удалось подготовить данные клиента" }
        }

        const address = await resolveOrderAddress(orderUser.id, {
            ...data,
            deliveryAddress: data.deliveryAddress?.trim(),
        })

        if (!address) {
            return { error: "Укажите адрес доставки" }
        }

        if (data.deliveryArea === "OUTSIDE_CITY") {
            return {
                error: "Доставка за пределы Читы оформляется только через менеджера. Свяжитесь с нами для согласования.",
            }
        }

        // Calculate cart totals
        const cartItems = cart.items.map((item: { quantity: unknown; product: { price: unknown } }) => ({
            quantity: Number(item.quantity),
            product: {
                price: Number(item.product.price),
            },
        }))

        const cartTotals = calculateCartTotals(
            cartItems,
            Number(orderUser.personalDiscount)
        )

        if (!isWithinCity(address.city, address.fullAddress)) {
            return {
                error: "Доставка за пределы Читы оформляется только через менеджера. Свяжитесь с нами для согласования.",
            }
        }

        // Generate order number
        const orderNumber = await generateOrderNumber()

        // Create order
        const order = await prisma.order.create({
            data: {
                orderNumber,
                userId: orderUser.id,
                addressId: address.id,
                status: "PENDING",
                paymentStatus: "PENDING",
                subtotal: cartTotals.subtotal,
                discountAmount: cartTotals.discountAmount,
                discountPercent: orderUser.personalDiscount,
                deliveryCost: 0,
                totalAmount: cartTotals.total,
                customerName,
                customerPhone,
                customerEmail,
                deliveryDate: new Date(),
                deliveryTimeSlot: "По согласованию",
                deliveryNotes: data.notes,
                deliveryAddress: address.fullAddress,
                paymentMethod: "phone_contact",
                items: {
                    create: cart.items.map((item: { quantity: unknown; product: { id: string; name: string; unit: string; price: unknown } }) => ({
                        product: { connect: { id: item.product.id } },
                        productName: item.product.name,
                        quantity: Number(item.quantity),
                        unit: item.product.unit as UnitType,
                        unitPrice: Number(item.product.price),
                        totalPrice:
                            Number(item.quantity) *
                            Number(item.product.price),
                    })),
                },
                statusHistory: {
                    create: {
                        status: "PENDING",
                        note: "Заявка создана. Требуется подтверждение по телефону.",
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
        revalidatePath("/client/orders")
        revalidatePath("/client")

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
