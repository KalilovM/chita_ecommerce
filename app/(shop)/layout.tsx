import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/shop/header"
import { Footer } from "@/components/shop/footer"
import { CartProvider } from "@/hooks/use-cart"
import { getGuestCart } from "@/actions/cart"

async function getCategories() {
    return prisma.category.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        select: { id: true, name: true, slug: true },
    })
}

async function getSettings() {
    const settings = await prisma.systemSetting.findMany()
    const settingsMap: Record<string, string> = {}
    settings.forEach(s => {
        settingsMap[s.key] = s.value
    })
    return settingsMap
}

export default async function ShopLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [session, categories, settings] = await Promise.all([
        auth(),
        getCategories(),
        getSettings(),
    ])

    // Get cart items for the cart provider
    const guestCart = await getGuestCart()
    const initialCartItems = guestCart?.items || []

    return (
        <div className="flex min-h-screen flex-col">
            <CartProvider initialItems={initialCartItems}>
                <Header user={session?.user} categories={categories} />
                <main className="flex-1">{children}</main>
                <Footer categories={categories} settings={settings} />
            </CartProvider>
        </div>
    )
}
