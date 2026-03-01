"use client"

import { useState, useTransition } from "react"
import { MapPin, Star, Trash2, Pencil, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { deleteAddress, setDefaultAddress } from "@/actions/client/settings"
import { AddressForm } from "./address-form"

interface AddressData {
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
    zoneName: string | null
}

interface AddressBookProps {
    addresses: AddressData[]
}

export function AddressBook({ addresses }: AddressBookProps) {
    const [isPending, startTransition] = useTransition()
    const [showForm, setShowForm] = useState(false)
    const [editingAddress, setEditingAddress] = useState<AddressData | null>(null)

    const handleDelete = (addressId: string) => {
        if (!confirm("Удалить этот адрес?")) return

        startTransition(async () => {
            const result = await deleteAddress(addressId)
            if (result.error) {
                alert(result.error)
            }
        })
    }

    const handleSetDefault = (addressId: string) => {
        startTransition(async () => {
            await setDefaultAddress(addressId)
        })
    }

    if (showForm || editingAddress) {
        return (
            <AddressForm
                address={editingAddress || undefined}
                onCancel={() => {
                    setShowForm(false)
                    setEditingAddress(null)
                }}
                onSuccess={() => {
                    setShowForm(false)
                    setEditingAddress(null)
                }}
            />
        )
    }

    return (
        <div className="space-y-4">
            {addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет сохранённых адресов</p>
            ) : (
                <div className="space-y-3">
                    {addresses.map((address) => (
                        <div key={address.id} className="flex items-start gap-3 p-3 border rounded-lg">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {address.label && (
                                        <span className="text-sm font-medium">{address.label}</span>
                                    )}
                                    {address.isDefault && (
                                        <Badge variant="default" className="text-xs">
                                            <Star className="h-3 w-3 mr-1" />
                                            По умолчанию
                                        </Badge>
                                    )}
                                    {address.zoneName && (
                                        <Badge variant="outline" className="text-xs">
                                            {address.zoneName}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {address.fullAddress}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {!address.isDefault && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSetDefault(address.id)}
                                        disabled={isPending}
                                        title="Сделать по умолчанию"
                                    >
                                        <Star className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingAddress(address)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() => handleDelete(address.id)}
                                    disabled={isPending}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить адрес
            </Button>
        </div>
    )
}
