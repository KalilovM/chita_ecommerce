/**
 * Geographic utilities for delivery zone calculations
 */

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * @param point - [longitude, latitude]
 * @param polygon - Array of [longitude, latitude] coordinates
 */
export function isPointInPolygon(
    point: [number, number],
    polygon: [number, number][]
): boolean {
    const [x, y] = point
    let inside = false

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i]
        const [xj, yj] = polygon[j]

        const intersect =
            yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

        if (intersect) inside = !inside
    }

    return inside
}

/**
 * Calculate distance between two points using Haversine formula
 * @param point1 - [longitude, latitude]
 * @param point2 - [longitude, latitude]
 * @returns Distance in kilometers
 */
export function calculateDistance(
    point1: [number, number],
    point2: [number, number]
): number {
    const [lng1, lat1] = point1
    const [lng2, lat2] = point2

    const R = 6371 // Earth's radius in km
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180)
}

/**
 * Get the center point of a polygon
 */
export function getPolygonCenter(
    polygon: [number, number][]
): [number, number] {
    let sumLng = 0
    let sumLat = 0

    for (const [lng, lat] of polygon) {
        sumLng += lng
        sumLat += lat
    }

    return [sumLng / polygon.length, sumLat / polygon.length]
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinates(lng: number, lat: number): boolean {
    return (
        typeof lng === "number" &&
        typeof lat === "number" &&
        !isNaN(lng) &&
        !isNaN(lat) &&
        lng >= -180 &&
        lng <= 180 &&
        lat >= -90 &&
        lat <= 90
    )
}

/**
 * Chita city center coordinates
 */
export const CHITA_CENTER: [number, number] = [113.5006, 52.034]

/**
 * Default warehouse coordinates (can be configured in system settings)
 */
export const WAREHOUSE_COORDS: [number, number] = [113.5006, 52.034]
