import { prisma } from "@/lib/prisma"
import { isPointInPolygon, calculateDistance, WAREHOUSE_COORDS } from "./geo"
import { formatRussianCurrency } from "./format"

interface DeliveryCostResult {
    zoneId: string | null
    zoneName: string | null
    deliveryCost: number
    displayCost: string
    minOrderAmount: number
    displayMinOrder: string
    freeDeliveryThreshold: number | null
    displayFreeThreshold: string | null
    isDeliveryAvailable: boolean
    message: string
}

/**
 * Calculate delivery cost based on customer coordinates
 */
export async function calculateDeliveryCost(
    coordinates: [number, number] // [longitude, latitude]
): Promise<DeliveryCostResult> {
    // Get all active delivery zones
    const zones = await prisma.deliveryZone.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
    })

    // Find zone that contains the point
    for (const zone of zones) {
        const polygon = zone.polygonCoordinates as [number, number][]

        if (isPointInPolygon(coordinates, polygon)) {
            // Calculate distance from warehouse for additional cost
            const distance = calculateDistance(WAREHOUSE_COORDS, coordinates)

            // Calculate total cost
            const baseCost = Number(zone.baseCost)
            const costPerKm = Number(zone.costPerKm)
            const additionalCost = Math.round(distance * costPerKm * 100) / 100
            const totalCost = baseCost + additionalCost

            const freeThreshold = zone.freeDeliveryThreshold
                ? Number(zone.freeDeliveryThreshold)
                : null

            return {
                zoneId: zone.id,
                zoneName: zone.name,
                deliveryCost: totalCost,
                displayCost: formatRussianCurrency(totalCost),
                minOrderAmount: Number(zone.minOrderAmount),
                displayMinOrder: formatRussianCurrency(Number(zone.minOrderAmount)),
                freeDeliveryThreshold: freeThreshold,
                displayFreeThreshold: freeThreshold
                    ? formatRussianCurrency(freeThreshold)
                    : null,
                isDeliveryAvailable: true,
                message: `Доставка в зону "${zone.name}"`,
            }
        }
    }

    // Point is not in any delivery zone
    return {
        zoneId: null,
        zoneName: null,
        deliveryCost: 0,
        displayCost: formatRussianCurrency(0),
        minOrderAmount: 0,
        displayMinOrder: formatRussianCurrency(0),
        freeDeliveryThreshold: null,
        displayFreeThreshold: null,
        isDeliveryAvailable: false,
        message: "К сожалению, доставка по указанному адресу недоступна",
    }
}

/**
 * Get final delivery cost considering order total and free delivery threshold
 */
export function getFinalDeliveryCost(
    baseCost: number,
    orderTotal: number,
    freeDeliveryThreshold: number | null
): { cost: number; isFree: boolean; amountToFreeDelivery: number | null } {
    if (freeDeliveryThreshold && orderTotal >= freeDeliveryThreshold) {
        return {
            cost: 0,
            isFree: true,
            amountToFreeDelivery: null,
        }
    }

    return {
        cost: baseCost,
        isFree: false,
        amountToFreeDelivery: freeDeliveryThreshold
            ? freeDeliveryThreshold - orderTotal
            : null,
    }
}

/**
 * Get available delivery time slots
 */
export async function getAvailableTimeSlots(date: Date) {
    const slots = await prisma.deliveryTimeSlot.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
    })

    // For future: check slot capacity
    // const ordersOnDate = await prisma.order.count({
    //   where: {
    //     deliveryDate: date,
    //     status: { notIn: ['CANCELLED'] }
    //   }
    // })

    return slots.map((slot: { id: string; name: string; startTime: string; endTime: string }) => ({
        id: slot.id,
        name: slot.name,
        time: `${slot.startTime}-${slot.endTime}`,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: true, // Implement capacity check if needed
    }))
}

/**
 * Get available delivery dates (next 7 days, excluding today if past cutoff)
 */
export function getAvailableDeliveryDates(
    cutoffHour: number = 18 // 6 PM cutoff for next day delivery
): Date[] {
    const dates: Date[] = []
    const now = new Date()
    const currentHour = now.getHours()

    // Start from tomorrow if past cutoff, otherwise from today
    let startOffset = currentHour >= cutoffHour ? 1 : 0

    for (let i = startOffset; i < startOffset + 7; i++) {
        const date = new Date()
        date.setDate(date.getDate() + i)
        date.setHours(0, 0, 0, 0)
        dates.push(date)
    }

    return dates
}
