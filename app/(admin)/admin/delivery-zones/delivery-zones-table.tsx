"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit } from "lucide-react"
import { formatRussianCurrency } from "@/lib/utils/format"

interface DeliveryZone {
    id: string
    name: string
    baseCost: number
    costPerKm: number
    minOrderAmount: number
    freeDeliveryThreshold: number
    color: string
    displayOrder: number
    isActive: boolean
    _count: {
        addresses: number
    }
}

interface DeliveryZonesTableProps {
    zones: DeliveryZone[]
}

export function DeliveryZonesTable({ zones }: DeliveryZonesTableProps) {
    return (
        <div className="space-y-2">
            {zones.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                    Зоны доставки не настроены
                </p>
            ) : (
                zones.map((zone) => (
                    <div
                        key={zone.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                    >
                        <div className="flex items-center space-x-3">
                            <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: zone.color }}
                            />
                            <div>
                                <p className="font-medium">{zone.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    От {formatRussianCurrency(Number(zone.baseCost))} •
                                    {Number(zone.freeDeliveryThreshold) > 0 && (
                                        <> Бесплатно от {formatRussianCurrency(Number(zone.freeDeliveryThreshold))}</>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Badge variant={zone.isActive ? "default" : "secondary"}>
                                {zone.isActive ? "Активна" : "Неактивна"}
                            </Badge>
                            <Link href={`/admin/delivery-zones/${zone.id}`}>
                                <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}
