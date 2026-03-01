import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ClaimDetailLoading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-9 w-40" />
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-72" />
                    <Skeleton className="h-4 w-32 mt-2" />
                </div>
                <Skeleton className="h-6 w-28" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-5 w-40" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="p-4 border rounded-lg space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded" />
                                        <Skeleton className="h-4 w-40" />
                                    </div>
                                    <Skeleton className="h-6 w-28" />
                                    <Skeleton className="h-4 w-full" />
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
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
