import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function SettingsLoading() {
    return (
        <div className="space-y-6 max-w-3xl">
            <Skeleton className="h-8 w-32" />
            {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-5 w-40" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-1/3" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
