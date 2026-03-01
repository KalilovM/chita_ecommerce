"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createSavedList } from "@/actions/client/saved-lists"

interface CreateListButtonProps {
    variant?: "default" | "outline"
}

export function CreateListButton({ variant = "default" }: CreateListButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleCreate = () => {
        if (!name.trim()) {
            setError("Введите название")
            return
        }

        startTransition(async () => {
            const result = await createSavedList({ name: name.trim(), type: "BASKET" })
            if (result.error) {
                setError(result.error)
            } else {
                setIsOpen(false)
                setName("")
                setError(null)
            }
        })
    }

    if (!isOpen) {
        return (
            <Button variant={variant} size="sm" onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Новый список
            </Button>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Input
                value={name}
                onChange={(e) => {
                    setName(e.target.value)
                    setError(null)
                }}
                placeholder="Название списка..."
                className="w-48"
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate()
                    if (e.key === "Escape") {
                        setIsOpen(false)
                        setName("")
                        setError(null)
                    }
                }}
            />
            <Button size="sm" onClick={handleCreate} disabled={isPending}>
                {isPending ? "..." : "Создать"}
            </Button>
            <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                    setIsOpen(false)
                    setName("")
                    setError(null)
                }}
            >
                Отмена
            </Button>
            {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
    )
}
