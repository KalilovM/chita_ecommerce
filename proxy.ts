export { auth as proxy } from "@/lib/auth"

export const config = {
    matcher: [
        "/profile/:path*",
        "/checkout/:path*",
        "/admin/:path*",
        "/api/cart/:path*",
        "/api/orders/:path*",
    ],
}