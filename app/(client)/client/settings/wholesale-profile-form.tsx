"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { WholesaleProfileSchema, type WholesaleProfileData } from "@/lib/validators/wholesale"
import { upsertWholesaleProfile } from "@/actions/client/settings"

interface WholesaleProfileFormProps {
    profile?: {
        companyName: string
        inn: string
        kpp: string
        ogrn: string
        legalAddress: string
        contactPerson: string
        contactPhone: string
        contactEmail: string
    }
    isVerified: boolean
}

export function WholesaleProfileForm({ profile, isVerified }: WholesaleProfileFormProps) {
    const [isPending, startTransition] = useTransition()
    const [serverError, setServerError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<WholesaleProfileData>({
        resolver: zodResolver(WholesaleProfileSchema),
        defaultValues: profile || {
            companyName: "",
            inn: "",
            kpp: "",
            ogrn: "",
            legalAddress: "",
            contactPerson: "",
            contactPhone: "",
            contactEmail: "",
        },
    })

    const onSubmit = (data: WholesaleProfileData) => {
        setServerError(null)
        setSuccess(false)

        startTransition(async () => {
            const result = await upsertWholesaleProfile(data)
            if (result.error) {
                setServerError(result.error)
            } else {
                setSuccess(true)
            }
        })
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Company name */}
            <div className="space-y-1.5">
                <Label htmlFor="companyName">Название компании *</Label>
                <Input
                    id="companyName"
                    {...register("companyName")}
                    disabled={isVerified}
                    placeholder="ООО «Ваша компания»"
                />
                {errors.companyName && (
                    <p className="text-xs text-destructive">{errors.companyName.message}</p>
                )}
            </div>

            {/* INN / KPP / OGRN row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="inn">ИНН</Label>
                    <Input
                        id="inn"
                        {...register("inn")}
                        disabled={isVerified}
                        placeholder="1234567890"
                    />
                    {errors.inn && (
                        <p className="text-xs text-destructive">{errors.inn.message}</p>
                    )}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="kpp">КПП</Label>
                    <Input
                        id="kpp"
                        {...register("kpp")}
                        disabled={isVerified}
                        placeholder="123456789"
                    />
                    {errors.kpp && (
                        <p className="text-xs text-destructive">{errors.kpp.message}</p>
                    )}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="ogrn">ОГРН</Label>
                    <Input
                        id="ogrn"
                        {...register("ogrn")}
                        disabled={isVerified}
                        placeholder="1234567890123"
                    />
                    {errors.ogrn && (
                        <p className="text-xs text-destructive">{errors.ogrn.message}</p>
                    )}
                </div>
            </div>

            {/* Legal address */}
            <div className="space-y-1.5">
                <Label htmlFor="legalAddress">Юридический адрес</Label>
                <Textarea
                    id="legalAddress"
                    {...register("legalAddress")}
                    disabled={isVerified}
                    placeholder="Полный юридический адрес компании"
                    rows={2}
                />
            </div>

            {/* Contact person */}
            <div className="space-y-1.5">
                <Label htmlFor="contactPerson">Контактное лицо *</Label>
                <Input
                    id="contactPerson"
                    {...register("contactPerson")}
                    disabled={isVerified}
                    placeholder="Иванов Иван Иванович"
                />
                {errors.contactPerson && (
                    <p className="text-xs text-destructive">{errors.contactPerson.message}</p>
                )}
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="contactPhone">Телефон *</Label>
                    <Input
                        id="contactPhone"
                        {...register("contactPhone")}
                        disabled={isVerified}
                        placeholder="+7 (999) 123-45-67"
                    />
                    {errors.contactPhone && (
                        <p className="text-xs text-destructive">{errors.contactPhone.message}</p>
                    )}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                        id="contactEmail"
                        type="email"
                        {...register("contactEmail")}
                        disabled={isVerified}
                        placeholder="company@example.com"
                    />
                    {errors.contactEmail && (
                        <p className="text-xs text-destructive">{errors.contactEmail.message}</p>
                    )}
                </div>
            </div>

            {/* Messages */}
            {serverError && (
                <p className="text-sm text-destructive">{serverError}</p>
            )}
            {success && (
                <p className="text-sm text-green-600">
                    Данные сохранены. {!profile ? "Заявка на верификацию отправлена." : ""}
                </p>
            )}

            {/* Submit */}
            {!isVerified && (
                <Button type="submit" disabled={isPending}>
                    {isPending
                        ? "Сохранение..."
                        : profile
                            ? "Обновить данные"
                            : "Отправить на верификацию"}
                </Button>
            )}
        </form>
    )
}
