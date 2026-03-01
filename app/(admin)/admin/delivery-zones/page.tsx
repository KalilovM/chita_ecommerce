import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Truck, MapPin } from "lucide-react"
import Link from "next/link"
import { formatRussianCurrency } from "@/lib/utils/format"
import { DeliveryZonesTable } from "./delivery-zones-table"

async function getDeliveryZones() {
    return prisma.deliveryZone.findMany({
        orderBy: { displayOrder: "asc" },
        include: {
            _count: {
                select: { addresses: true },
            },
        },
    })
}

async function getTimeSlots() {
    return prisma.deliveryTimeSlot.findMany({
        orderBy: { displayOrder: "asc" },
    })
}

export default async function DeliveryZonesPage() {
    const [zones, timeSlots] = await Promise.all([
        getDeliveryZones(),
        getTimeSlots(),
    ])

    const stats = {
        totalZones: zones.length,
        activeZones: zones.filter((z) => z.isActive).length,
        totalSlots: timeSlots.length,
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Зоны доставки</h1>
                    <p className="text-muted-foreground">
                        Управление зонами и временными слотами доставки
                    </p>
                </div>
                <Link href="/admin/delivery-zones/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Добавить зону
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Всего зон
                        </CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalZones}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Активных зон
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {stats.activeZones}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Временных слотов
                        </CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSlots}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Зоны доставки</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DeliveryZonesTable zones={zones} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Временные слоты</CardTitle>
                        <Link href="/admin/delivery-zones/time-slots">
                            <Button variant="outline" size="sm">
                                Управление
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {timeSlots.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                Временные слоты не настроены
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {timeSlots.map((slot) => (
                                    <div
                                        key={slot.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                    >
                                        <div>
                                            <p className="font-medium">{slot.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {slot.startTime} - {slot.endTime}
                                            </p>
                                        </div>
                                        <Badge variant={slot.isActive ? "default" : "secondary"}>
                                            {slot.isActive ? "Активен" : "Неактивен"}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
