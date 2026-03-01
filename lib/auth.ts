import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { UserLoginSchema } from "./validators/user"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            email: string
            name: string
            role: "CUSTOMER" | "WHOLESALE" | "ADMIN"
            isWholesale: boolean
            personalDiscount: number
        }
    }

    interface User {
        role: "CUSTOMER" | "WHOLESALE" | "ADMIN"
        isWholesale: boolean
        personalDiscount: number
    }
}

export const authConfig: NextAuthConfig = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adapter: PrismaAdapter(prisma) as any,
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.isWholesale = user.isWholesale
                token.personalDiscount = user.personalDiscount
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as "CUSTOMER" | "WHOLESALE" | "ADMIN"
                session.user.isWholesale = token.isWholesale as boolean
                session.user.personalDiscount = token.personalDiscount as number
            }
            return session
        },
        async authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnAdmin = nextUrl.pathname.startsWith("/admin")
            const isOnProfile = nextUrl.pathname.startsWith("/profile")
            const isOnCheckout = nextUrl.pathname.startsWith("/checkout")

            if (isOnAdmin) {
                if (!isLoggedIn) return false
                return auth.user.role === "ADMIN"
            }

            if (isOnProfile || isOnCheckout) {
                return isLoggedIn
            }

            return true
        },
    },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = UserLoginSchema.safeParse(credentials)

                if (!parsed.success) {
                    return null
                }

                const { email, password } = parsed.data

                const user = await prisma.user.findUnique({
                    where: { email: email.toLowerCase() },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        passwordHash: true,
                        role: true,
                        isWholesale: true,
                        personalDiscount: true,
                    },
                })

                if (!user || !user.passwordHash) {
                    return null
                }

                const isValidPassword = await bcrypt.compare(password, user.passwordHash)

                if (!isValidPassword) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    isWholesale: user.isWholesale,
                    personalDiscount: Number(user.personalDiscount),
                }
            },
        }),
    ],
}

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)
