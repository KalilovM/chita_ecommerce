import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { requireClientAuth } from "@/lib/auth-utils"
import { getClaimableOrders } from "@/actions/client/claims"
import { ClaimForm } from "./claim-form"

interface NewClaimPageProps {
    searchParams: Promise<{ orderId?: string }>
}

export default async function NewClaimPage({ searchParams }: NewClaimPageProps) {
    await requireClientAuth()

    const params = await searchParams
    const orders = await getClaimableOrders()

    if (orders.length === 0) {
        return (
            <div className="space-y-6">
                <Link href="/client/claims">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Назад к претензиям
                    </Button>
                </Link>
                <div className="text-center py-12">
                    <h2 className="text-lg font-medium text-muted-foreground">
                        Нет заказов, по которым можно подать претензию
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Претензию можно подать только по доставленным заказам
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Link href="/client/claims">
                <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Назад к претензиям
                </Button>
            </Link>

            <h1 className="text-2xl font-bold">Создать претензию</h1>

            <ClaimForm
                orders={orders.map((o) => ({
                    id: o.id,
                    orderNumber: o.orderNumber,
                    createdAt: o.createdAt.toISOString(),
                    items: o.items.map((item) => ({
                        productId: item.productId,
                        productName: item.productName,
                        quantity: Number(item.quantity),
                        unit: item.unit,
                        image: item.product?.images?.[0]?.url || null,
                    })),
                }))}
                preselectedOrderId={params.orderId}
            />
        </div>
    )
}
