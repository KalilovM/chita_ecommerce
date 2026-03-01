import { NextRequest, NextResponse } from "next/server"
import { addToCart, getGuestCart } from "@/actions/cart"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { productId, quantity } = body

        if (!productId || !quantity) {
            return NextResponse.json(
                { error: "Не указан товар или количество" },
                { status: 400 }
            )
        }

        const result = await addToCart(productId, quantity)

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        const cart = await getGuestCart()
        return NextResponse.json(cart)
    } catch (error) {
        console.error("Add to cart API error:", error)
        return NextResponse.json(
            { error: "Ошибка при добавлении в корзину" },
            { status: 500 }
        )
    }
}
