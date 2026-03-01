import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export * from "./format"
export * from "./price"
export * from "./geo"
export * from "./delivery"
// Note: order-number.ts uses prisma and must be imported directly in server components
