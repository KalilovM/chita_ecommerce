"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateSavedList, deleteSavedList } from "@/actions/client/saved-lists"

interface ListDetailActionsProps {
    listId: string
    currentName: string
    listType: string
}

export function ListDetailActions({ listId, currentName, listType }: ListDetailActionsProps) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(currentName)
    const [isPending, startTransition] = useTransition()

    const handleSave = () => {
        if (!name.trim()) return

        startTransition(async () => {
            const result = await updateSavedList(listId, { name: name.trim() })
            if (!result.error) {
                setIsEditing(false)
            }
        })
    }

    const handleDelete = () => {
        if (!confirm("Удалить этот список?")) return

        startTransition(async () => {
            const result = await deleteSavedList(listId)
            if (!result.error) {
                router.push("/client/lists")
            }
        })
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-64"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave()
                        if (e.key === "Escape") {
                            setIsEditing(false)
                            setName(currentName)
                        }
                    }}
                />
                <Button size="sm" variant="ghost" onClick={handleSave} disabled={isPending}>
                    <Check className="h-4 w-4" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                        setIsEditing(false)
                        setName(currentName)
                    }}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{currentName}</h1>
            {listType === "BASKET" && (
                <>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditing(true)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={handleDelete}
                        disabled={isPending}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </>
            )}
        </div>
    )
}
