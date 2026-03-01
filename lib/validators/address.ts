import { z } from "zod"

export const AddressFormSchema = z.object({
    label: z.string().optional(),
    fullAddress: z.string().min(10, "Введите полный адрес"),
    city: z.string().default("Чита"),
    street: z.string().min(2, "Введите улицу"),
    building: z.string().min(1, "Введите номер дома"),
    apartment: z.string().optional(),
    entrance: z.string().optional(),
    floor: z.string().optional(),
    intercom: z.string().optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    isDefault: z.boolean().default(false),
})

export type AddressFormData = z.infer<typeof AddressFormSchema>

export const AddressSelectSchema = z.object({
    addressId: z.string().min(1, "Выберите адрес доставки"),
})

export type AddressSelectData = z.infer<typeof AddressSelectSchema>

// Coordinates validation for map interactions
export const CoordinatesSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
})

export type Coordinates = z.infer<typeof CoordinatesSchema>
