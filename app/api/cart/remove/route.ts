import { NextRequest, NextResponse } from "next/server"
import { removeFromCart, getGuestCart } from "@/actions/cart"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { itemId } = body

        if (!itemId) {
            return NextResponse.json(
                { error: "Не указан товар" },
                { status: 400 }
            )
        }

        const result = await removeFromCart(itemId)

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        const cart = await getGuestCart()
        return NextResponse.json(cart)
    } catch (error) {
        console.error("Remove from cart API error:", error)
        return NextResponse.json(
            { error: "Ошибка при удалении из корзины" },
            { status: 500 }
        )
    }
}
