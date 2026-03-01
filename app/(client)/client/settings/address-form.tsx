"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AddressFormSchema } from "@/lib/validators/address"
import type { z } from "zod"
import { createAddress, updateAddress } from "@/actions/client/settings"

type AddressFormValues = z.input<typeof AddressFormSchema>

interface AddressFormProps {
    address?: {
        id: string
        label: string | null
        fullAddress: string
        city: string
        street: string
        building: string
        apartment: string | null
        entrance: string | null
        floor: string | null
        intercom: string | null
        latitude: number
        longitude: number
        isDefault: boolean
    }
    onCancel: () => void
    onSuccess: () => void
}

export function AddressForm({ address, onCancel, onSuccess }: AddressFormProps) {
    const [isPending, startTransition] = useTransition()
    const [serverError, setServerError] = useState<string | null>(null)
    const isEdit = !!address

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AddressFormValues>({
        resolver: zodResolver(AddressFormSchema),
        defaultValues: address
            ? {
                label: address.label || "",
                fullAddress: address.fullAddress,
                city: address.city,
                street: address.street,
                building: address.building,
                apartment: address.apartment || "",
                entrance: address.entrance || "",
                floor: address.floor || "",
                intercom: address.intercom || "",
                latitude: address.latitude,
                longitude: address.longitude,
                isDefault: address.isDefault,
            }
            : {
                label: "",
                fullAddress: "",
                city: "Чита",
                street: "",
                building: "",
                apartment: "",
                entrance: "",
                floor: "",
                intercom: "",
                latitude: 52.0515,  // Chita center default
                longitude: 113.4712,
                isDefault: false,
            },
    })

    const onSubmit = (data: AddressFormValues) => {
        setServerError(null)

        startTransition(async () => {
            const result = isEdit
                ? await updateAddress(address!.id, data)
                : await createAddress(data)

            if (result.error) {
                setServerError(result.error)
            } else {
                onSuccess()
            }
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h3 className="text-sm font-medium">
                {isEdit ? "Редактировать адрес" : "Новый адрес"}
            </h3>

            {/* Label */}
            <div className="space-y-1.5">
                <Label htmlFor="label">Название (опционально)</Label>
                <Input
                    id="label"
                    {...register("label")}
                    placeholder="Офис, Склад и т.д."
                />
            </div>

            {/* Full address */}
            <div className="space-y-1.5">
                <Label htmlFor="fullAddress">Полный адрес *</Label>
                <Input
                    id="fullAddress"
                    {...register("fullAddress")}
                    placeholder="г. Чита, ул. Ленина, д. 1"
                />
                {errors.fullAddress && (
                    <p className="text-xs text-destructive">{errors.fullAddress.message}</p>
                )}
            </div>

            {/* Street + Building */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="street">Улица *</Label>
                    <Input
                        id="street"
                        {...register("street")}
                        placeholder="ул. Ленина"
                    />
                    {errors.street && (
                        <p className="text-xs text-destructive">{errors.street.message}</p>
                    )}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="building">Дом *</Label>
                    <Input
                        id="building"
                        {...register("building")}
                        placeholder="1"
                    />
                    {errors.building && (
                        <p className="text-xs text-destructive">{errors.building.message}</p>
                    )}
                </div>
            </div>

            {/* Apartment, entrance, floor, intercom */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="apartment">Квартира/Офис</Label>
                    <Input id="apartment" {...register("apartment")} placeholder="12" />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="entrance">Подъезд</Label>
                    <Input id="entrance" {...register("entrance")} placeholder="1" />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="floor">Этаж</Label>
                    <Input id="floor" {...register("floor")} placeholder="3" />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="intercom">Домофон</Label>
                    <Input id="intercom" {...register("intercom")} placeholder="12#" />
                </div>
            </div>

            {/* Coordinates (hidden or manual for now - integrate with map later) */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="latitude">Широта</Label>
                    <Input
                        id="latitude"
                        type="number"
                        step="any"
                        {...register("latitude", { valueAsNumber: true })}
                    />
                    {errors.latitude && (
                        <p className="text-xs text-destructive">{errors.latitude.message}</p>
                    )}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="longitude">Долгота</Label>
                    <Input
                        id="longitude"
                        type="number"
                        step="any"
                        {...register("longitude", { valueAsNumber: true })}
                    />
                    {errors.longitude && (
                        <p className="text-xs text-destructive">{errors.longitude.message}</p>
                    )}
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                Координаты определяются автоматически при интеграции с картой. Пока можно ввести вручную.
            </p>

            {/* Default checkbox */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="isDefault"
                    {...register("isDefault")}
                    className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isDefault" className="text-sm">
                    Адрес по умолчанию
                </Label>
            </div>

            {/* Error */}
            {serverError && (
                <p className="text-sm text-destructive">{serverError}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Сохранение..." : isEdit ? "Сохранить" : "Добавить"}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                    Отмена
                </Button>
            </div>
        </form>
    )
}
