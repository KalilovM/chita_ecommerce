import { auth } from "./auth"
import { redirect } from "next/navigation"

/**
 * Require authentication for a page/action
 */
export async function requireAuth() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    return session
}

/**
 * Require admin role for a page/action
 */
export async function requireAdmin() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    if (session.user.role !== "ADMIN") {
        redirect("/")
    }

    return session
}

/**
 * Get optional auth session (doesn't redirect)
 */
export async function getOptionalAuth() {
    return await auth()
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const session = await auth()
    return !!session?.user
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
    const session = await auth()
    return session?.user?.role === "ADMIN"
}

/**
 * Require auth for client portal pages.
 * Returns session. Redirects to /login if not authenticated.
 */
export async function requireClientAuth() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    return session
}

/**
 * Check if user has verified wholesale status.
 * Does NOT redirect — returns boolean for conditional UI rendering.
 */
export async function isWholesaleVerified(): Promise<boolean> {
    const session = await auth()
    return session?.user?.isWholesale === true && session?.user?.role === "WHOLESALE"
}
