import { NextResponse } from "next/server"
import { getGuestCart } from "@/actions/cart"

export async function GET() {
    try {
        const cart = await getGuestCart()
        return NextResponse.json(cart)
    } catch (error) {
        console.error("Get cart API error:", error)
        return NextResponse.json({ items: [] })
    }
}
