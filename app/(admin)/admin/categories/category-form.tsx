"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { createCategory, updateCategory } from "@/actions/admin/categories"

interface Category {
    id: string
    name: string
    slug: string
    description: string | null
    imageUrl: string | null
    displayOrder: number
    isActive: boolean
    parentId: string | null
}

interface ParentCategory {
    id: string
    name: string
}

interface CategoryFormProps {
    category?: Category
    parentCategories: ParentCategory[]
}

function generateSlug(name: string): string {
    const translitMap: Record<string, string> = {
        а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
        з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
        п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
        ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
        я: "ya",
    }

    return name
        .toLowerCase()
        .split("")
        .map((char) => translitMap[char] || char)
        .join("")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
}

export function CategoryForm({ category, parentCategories }: CategoryFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: category?.name || "",
        slug: category?.slug || "",
        description: category?.description || "",
        imageUrl: category?.imageUrl || "",
        displayOrder: category?.displayOrder || 0,
        isActive: category?.isActive ?? true,
        parentId: category?.parentId || "",
    })

    const handleNameChange = (name: string) => {
        setFormData((prev) => ({
            ...prev,
            name,
            slug: prev.slug || generateSlug(name),
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const data = {
            ...formData,
            parentId: formData.parentId || null,
        }

        startTransition(async () => {
            const result = category
                ? await updateCategory(category.id, data)
                : await createCategory(data)

            if (result.error) {
                setError(result.error)
            } else {
                router.push("/admin/categories")
                router.refresh()
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Название *</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Овощи"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL) *</Label>
                    <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) =>
                            setFormData({ ...formData, slug: e.target.value })
                        }
                        placeholder="vegetables"
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        Используется в URL: /catalog/{formData.slug || "slug"}
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Описание категории..."
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="imageUrl">URL изображения</Label>
                    <Input
                        id="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) =>
                            setFormData({ ...formData, imageUrl: e.target.value })
                        }
                        placeholder="https://example.com/image.jpg"
                    />
                    {formData.imageUrl && (
                        <img
                            src={formData.imageUrl}
                            alt="Preview"
                            className="mt-2 h-20 w-20 object-cover rounded"
                        />
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="parentId">Родительская категория</Label>
                    <select
                        id="parentId"
                        value={formData.parentId}
                        onChange={(e) =>
                            setFormData({ ...formData, parentId: e.target.value })
                        }
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                        <option value="">Нет (корневая категория)</option>
                        {parentCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="displayOrder">Порядок отображения</Label>
                    <Input
                        id="displayOrder"
                        type="number"
                        value={formData.displayOrder}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                displayOrder: parseInt(e.target.value) || 0,
                            })
                        }
                    />
                </div>

                <div className="space-y-2">
                    <Label>Статус</Label>
                    <div className="flex items-center space-x-4 pt-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                checked={formData.isActive}
                                onChange={() =>
                                    setFormData({ ...formData, isActive: true })
                                }
                                className="w-4 h-4"
                            />
                            <span>Активна</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                checked={!formData.isActive}
                                onChange={() =>
                                    setFormData({ ...formData, isActive: false })
                                }
                                className="w-4 h-4"
                            />
                            <span>Скрыта</span>
                        </label>
                    </div>
                </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end space-x-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                >
                    Отмена
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {category ? "Сохранить" : "Создать"}
                </Button>
            </div>
        </form>
    )
}
