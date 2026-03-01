import { FileText } from "lucide-react"
import { EmptyState } from "@/components/client/empty-state"
import { requireClientAuth } from "@/lib/auth-utils"

export default async function DocumentsPage() {
    await requireClientAuth()

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Документы</h1>

            <EmptyState
                icon={FileText}
                title="Раздел документов"
                description="Здесь будут отображаться документы по вашим заказам: счета, накладные, акты сверки и другие документы. Раздел находится в разработке."
            />
        </div>
    )
}
