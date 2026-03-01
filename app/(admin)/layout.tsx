import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/login")
    }

    return (
        <div className="flex min-h-screen">
            <AdminSidebar />
            <div className="flex-1 flex flex-col">
                <AdminHeader user={session.user} />
                <main className="flex-1 p-6 bg-muted/30">
                    {children}
                </main>
            </div>
        </div>
    )
}
