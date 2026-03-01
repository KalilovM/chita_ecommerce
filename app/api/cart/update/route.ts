import { NextRequest, NextResponse } from "next/server"
import { updateCartItemQuantity, getGuestCart } from "@/actions/cart"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { itemId, quantity } = body

        if (!itemId || quantity === undefined) {
            return NextResponse.json(
                { error: "Не указан товар или количество" },
                { status: 400 }
            )
        }

        const result = await updateCartItemQuantity(itemId, quantity)

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        const cart = await getGuestCart()
        return NextResponse.json(cart)
    } catch (error) {
        console.error("Update cart API error:", error)
        return NextResponse.json(
            { error: "Ошибка при обновлении корзины" },
            { status: 500 }
        )
    }
}
