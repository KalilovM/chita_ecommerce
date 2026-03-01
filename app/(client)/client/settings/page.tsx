import { requireClientAuth } from "@/lib/auth-utils"
import { getWholesaleProfile, getAddresses } from "@/actions/client/settings"
import { VerificationBadge } from "@/components/client/verification-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { WholesaleProfileForm } from "./wholesale-profile-form"
import { AddressBook } from "./address-book"
import { NotificationSettings } from "./notification-settings"

export default async function SettingsPage() {
    const session = await requireClientAuth()

    const [profile, addresses] = await Promise.all([
        getWholesaleProfile(),
        getAddresses(),
    ])

    return (
        <div className="space-y-6 max-w-3xl">
            <h1 className="text-2xl font-bold">Настройки</h1>

            {/* Verification Status */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Статус верификации</CardTitle>
                        <VerificationBadge
                            status={profile?.verificationStatus as "PENDING" | "VERIFIED" | "REJECTED" | null ?? null}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {!profile ? (
                        <p className="text-sm text-muted-foreground">
                            Заполните данные компании ниже для прохождения верификации оптового клиента.
                            После верификации вам будут доступны оптовые цены, оформление заказов и другие функции.
                        </p>
                    ) : profile.verificationStatus === "PENDING" ? (
                        <p className="text-sm text-muted-foreground">
                            Ваша заявка на верификацию отправлена и находится на рассмотрении.
                            Мы свяжемся с вами после проверки данных.
                        </p>
                    ) : profile.verificationStatus === "REJECTED" ? (
                        <div>
                            <p className="text-sm text-destructive">
                                Ваша заявка была отклонена.
                            </p>
                            {profile.verificationNote && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Причина: {profile.verificationNote}
                                </p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                                Вы можете исправить данные и отправить заявку повторно.
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-green-600">
                            Ваша компания верифицирована. Вам доступны все оптовые функции.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Wholesale Profile Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Данные компании</CardTitle>
                </CardHeader>
                <CardContent>
                    <WholesaleProfileForm
                        profile={profile ? {
                            companyName: profile.companyName,
                            inn: profile.inn || "",
                            kpp: profile.kpp || "",
                            ogrn: profile.ogrn || "",
                            legalAddress: profile.legalAddress || "",
                            contactPerson: profile.contactPerson,
                            contactPhone: profile.contactPhone,
                            contactEmail: profile.contactEmail || "",
                        } : undefined}
                        isVerified={profile?.verificationStatus === "VERIFIED"}
                    />
                </CardContent>
            </Card>

            {/* Address Book */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Адреса доставки</CardTitle>
                </CardHeader>
                <CardContent>
                    <AddressBook
                        addresses={addresses.map((a) => ({
                            id: a.id,
                            label: a.label,
                            fullAddress: a.fullAddress,
                            city: a.city,
                            street: a.street,
                            building: a.building,
                            apartment: a.apartment,
                            entrance: a.entrance,
                            floor: a.floor,
                            intercom: a.intercom,
                            latitude: Number(a.latitude),
                            longitude: Number(a.longitude),
                            isDefault: a.isDefault,
                            zoneName: a.deliveryZone?.name || null,
                        }))}
                    />
                </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Уведомления</CardTitle>
                </CardHeader>
                <CardContent>
                    <NotificationSettings />
                </CardContent>
            </Card>
        </div>
    )
}
