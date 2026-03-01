"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"

export function NotificationSettings() {
    const [emailEnabled, setEmailEnabled] = useState(true)
    const [smsEnabled, setSmsEnabled] = useState(false)
    const [telegramEnabled, setTelegramEnabled] = useState(false)

    // Placeholder: these would integrate with a server action to persist preferences
    const toggles = [
        {
            id: "email",
            label: "Email-уведомления",
            description: "Получать уведомления о статусе заказов и претензий по email",
            checked: emailEnabled,
            onChange: setEmailEnabled,
        },
        {
            id: "sms",
            label: "SMS-уведомления",
            description: "Получать SMS о доставке и важных событиях",
            checked: smsEnabled,
            onChange: setSmsEnabled,
        },
        {
            id: "telegram",
            label: "Telegram-уведомления",
            description: "Подключить Telegram-бот для мгновенных уведомлений",
            checked: telegramEnabled,
            onChange: setTelegramEnabled,
        },
    ]

    return (
        <div className="space-y-4">
            {toggles.map((toggle) => (
                <div key={toggle.id} className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        id={toggle.id}
                        checked={toggle.checked}
                        onChange={(e) => toggle.onChange(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 mt-1"
                    />
                    <div>
                        <Label htmlFor={toggle.id} className="text-sm font-medium">
                            {toggle.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{toggle.description}</p>
                    </div>
                </div>
            ))}
            <p className="text-xs text-muted-foreground">
                Настройки уведомлений будут подключены в ближайшем обновлении.
            </p>
        </div>
    )
}
