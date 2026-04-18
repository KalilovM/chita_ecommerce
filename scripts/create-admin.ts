import bcrypt from "bcryptjs"
import { prisma } from "../lib/prisma"

function requireEnv(name: string) {
    const value = process.env[name]?.trim()

    if (!value) {
        throw new Error(`${name} is required`)
    }

    return value
}

async function main() {
    const email = requireEnv("ADMIN_EMAIL").toLowerCase()
    const password = requireEnv("ADMIN_PASSWORD")
    const name = process.env.ADMIN_NAME?.trim() || "Admin"
    const phone = process.env.ADMIN_PHONE?.trim() || null

    if (password.length < 8) {
        throw new Error("ADMIN_PASSWORD must be at least 8 characters long")
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            name,
            phone,
            passwordHash,
            role: "ADMIN",
            isWholesale: false,
        },
        create: {
            email,
            name,
            phone,
            passwordHash,
            role: "ADMIN",
            isWholesale: false,
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
        },
    })

    console.log(`Admin account is ready: ${user.email} (${user.role})`)
}

main()
    .catch((error) => {
        console.error("Failed to create admin account:", error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
