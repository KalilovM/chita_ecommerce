import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClientSidebar } from "@/components/client/sidebar"
import { ClientHeader } from "@/components/client/header"

export default async function ClientLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    // Fetch wholesale profile for header display
    const wholesaleProfile = await prisma.wholesaleProfile.findUnique({
        where: { userId: session.user.id },
        select: { companyName: true },
    })

    return (
        <div className="flex min-h-screen">
            <ClientSidebar />
            <div className="flex-1 flex flex-col">
                <ClientHeader
                    userName={session.user.name}
                    companyName={wholesaleProfile?.companyName}
                />
                <main className="flex-1 p-4 lg:p-6 bg-muted/30">
                    {children}
                </main>
            </div>
        </div>
    )
}
