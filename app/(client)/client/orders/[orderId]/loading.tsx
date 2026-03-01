import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function OrderDetailLoading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-9 w-40" />
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32 mt-2" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-36" />
                    <Skeleton className="h-9 w-36" />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-5 w-20" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded" />
                                        <Skeleton className="h-4 w-40" />
                                    </div>
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-28" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-6 w-6 rounded-full" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
