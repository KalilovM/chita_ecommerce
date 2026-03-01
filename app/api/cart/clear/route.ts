import { NextResponse } from "next/server"
import { clearCart } from "@/actions/cart"

export async function POST() {
    try {
        const result = await clearCart()

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        return NextResponse.json({ items: [] })
    } catch (error) {
        console.error("Clear cart API error:", error)
        return NextResponse.json(
            { error: "Ошибка при очистке корзины" },
            { status: 500 }
        )
    }
}
