import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ClientOverviewLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-40 mt-2" />
            </div>

            {/* Contact & Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                    <Card key={i}>
                        <CardHeader className="pb-3">
                            <Skeleton className="h-4 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-4 w-36 mt-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="flex items-center gap-4 py-4">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div>
                                <Skeleton className="h-7 w-12" />
                                <Skeleton className="h-3 w-24 mt-1" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* CTAs */}
            <div className="flex gap-3">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-48" />
            </div>
        </div>
    )
}
