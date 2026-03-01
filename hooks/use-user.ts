"use client"

import { useSession } from "next-auth/react"

export function useUser() {
    const { data: session, status } = useSession()

    return {
        user: session?.user ?? null,
        isLoading: status === "loading",
        isAuthenticated: status === "authenticated",
        isWholesale: session?.user?.isWholesale ?? false,
        personalDiscount: session?.user?.personalDiscount ?? 0,
        isAdmin: session?.user?.role === "ADMIN",
    }
}
