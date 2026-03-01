import Link from "next/link"
import { redirect } from "next/navigation"
import {
    ShoppingCart,
    AlertTriangle,
    Heart,
    ArrowRight,
    RefreshCcw,
    MapPin,
    Phone,
    Mail,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VerificationBadge } from "@/components/client/verification-badge"
import { WholesaleGate } from "@/components/client/wholesale-gate"
import { getClientOverview } from "@/actions/client/overview"

export default async function ClientOverviewPage() {
    const overview = await getClientOverview()

    if (!overview) {
        redirect("/login")
    }

    const { user, wholesaleProfile, stats, defaultAddress, lastOrder } = overview
    const isVerified = wholesaleProfile?.verificationStatus === "VERIFIED"

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">
                    {wholesaleProfile?.companyName || user.name}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                    <VerificationBadge
                        status={wholesaleProfile?.verificationStatus as "PENDING" | "VERIFIED" | "REJECTED" | null ?? null}
                    />
                    {wholesaleProfile?.contactPerson && (
                        <span className="text-sm text-muted-foreground">
                            {wholesaleProfile.contactPerson}
                        </span>
                    )}
                </div>
            </div>

            {/* Verification CTA */}
            {!isVerified && (
                <WholesaleGate isVerified={false}>
                    <div />
                </WholesaleGate>
            )}

            {/* Contact & Address Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Контактные данные
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{user.email}</span>
                        </div>
                        {wholesaleProfile?.contactPhone && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{wholesaleProfile.contactPhone}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Адрес доставки по умолчанию
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {defaultAddress ? (
                            <div className="flex items-start gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span>{defaultAddress.fullAddress}</span>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Нет адреса.{" "}
                                <Link href="/client/settings" className="text-primary hover:underline">
                                    Добавить
                                </Link>
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Stats tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/client/orders?status=active">
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                        <CardContent className="flex items-center gap-4 py-4">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <ShoppingCart className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.activeOrdersCount}</p>
                                <p className="text-xs text-muted-foreground">Активные заказы</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/client/claims">
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                        <CardContent className="flex items-center gap-4 py-4">
                            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.openClaimsCount}</p>
                                <p className="text-xs text-muted-foreground">Открытые претензии</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/client/lists">
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                        <CardContent className="flex items-center gap-4 py-4">
                            <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                                <Heart className="h-5 w-5 text-pink-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.savedListsCount}</p>
                                <p className="text-xs text-muted-foreground">Сохранённые списки</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-wrap gap-3">
                <Link href="/client/orders">
                    <Button>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Смотреть заказы
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </Link>

                {isVerified && lastOrder && (
                    <Link href={`/client/orders/${lastOrder.id}`}>
                        <Button variant="outline">
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Повторить последний заказ
                        </Button>
                    </Link>
                )}

                {!isVerified && (
                    <Link href="/client/settings">
                        <Button variant="default">
                            Пройти верификацию
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    )
}
