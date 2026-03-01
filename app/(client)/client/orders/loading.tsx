import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function OrdersLoading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-4 border-b pb-2">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-24" />
                ))}
            </div>
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i}>
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-4 w-56 mt-2" />
                                </div>
                                <Skeleton className="h-9 w-28" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
