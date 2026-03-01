"use client"

import { ReactNode } from "react"
import { AuthProvider } from "./session-provider"
import { CartProvider } from "@/hooks/use-cart"

interface ProvidersProps {
    children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
    return (
        <AuthProvider>
            <CartProvider>{children}</CartProvider>
        </AuthProvider>
    )
}
