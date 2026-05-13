"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, X, Star, Sparkles } from "lucide-react"
import { createProduct, updateProduct, uploadProductImages } from "@/actions/admin/products"
import { slugify } from "@/lib/utils"

interface ProductImage {
    id?: string
    url: string
    alt: string | null
    displayOrder: number
    isPrimary: boolean
}

interface Product {
    id: string
    name: string
    slug: string
    description: string | null
    shortDescription: string | null
    variantGroup: string | null
    variationName: string | null
    variationAttributes: string | null
    price: number
    unit: string
    minOrderQuantity: number
    stepQuantity: number
    packagingType: string | null
    packagingQuantity: number | null
    packagingUnit: string | null
    isActive: boolean
    isHit: boolean
    isNew: boolean
    metaTitle: string | null
    metaDescription: string | null
    originCountry: string
    categoryId: string
    images: ProductImage[]
}

interface Category {
    id: string
    name: string
}

interface ProductFormProps {
    product?: Product
    categories: Category[]
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

export function ProductForm({ product, categories }: ProductFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: product?.name || "",
        slug: product?.slug || "",
        description: product?.description || "",
        shortDescription: product?.shortDescription || "",
        variantGroup: product?.variantGroup || "",
        variationName: product?.variationName || "",
        variationAttributes: product?.variationAttributes || "",
        price: product ? Number(product.price) : 0,
        unit: product?.unit || "KG",
        minOrderQuantity: product ? Number(product.minOrderQuantity) : 1,
        stepQuantity: product ? Number(product.stepQuantity) : 0.1,
        packagingType: product?.packagingType || "",
        packagingQuantity: product?.packagingQuantity ?? null,
        packagingUnit: product?.packagingUnit || "",
        isActive: product?.isActive ?? true,
        isHit: product?.isHit ?? false,
        isNew: product?.isNew ?? false,
        metaTitle: product?.metaTitle || "",
        metaDescription: product?.metaDescription || "",
        originCountry: product?.originCountry || "Китай",
        categoryId: product?.categoryId || "",
    })

    const [images, setImages] = useState<ProductImage[]>(
        product?.images || []
    )
    const [isUploadingImages, setIsUploadingImages] = useState(false)
    const [imageUploadError, setImageUploadError] = useState<string | null>(null)

    const handleNameChange = (name: string) => {
        setFormData((prev) => ({
            ...prev,
            name,
            slug: prev.slug || slugify(name),
        }))
    }

    const uploadImages = async (files: FileList | null) => {
        if (!files?.length) return

        setImageUploadError(null)
        setIsUploadingImages(true)

        const uploadData = new FormData()
        Array.from(files).forEach((file) => uploadData.append("images", file))

        try {
            const result = await uploadProductImages(uploadData)

            if (result.error) {
                setImageUploadError(result.error)
                return
            }

            if (!result.images?.length) {
                return
            }

            setImages((currentImages) => {
                const hasPrimaryImage = currentImages.some((image) => image.isPrimary)

                return [
                    ...currentImages,
                    ...result.images.map((image, index) => ({
                        url: image.url,
                        alt: image.alt || formData.name,
                        displayOrder: currentImages.length + index,
                        isPrimary: !hasPrimaryImage && index === 0,
                    })),
                ]
            })
        } finally {
            setIsUploadingImages(false)
        }
    }

    const removeImage = (index: number) => {
        const updated = images.filter((_, i) => i !== index)
        // If we removed the primary image, make the first one primary
        if (images[index].isPrimary && updated.length > 0) {
            updated[0].isPrimary = true
        }
        setImages(updated)
    }

    const setPrimaryImage = (index: number) => {
        setImages(
            images.map((img, i) => ({
                ...img,
                isPrimary: i === index,
            }))
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!formData.categoryId) {
            setError("Выберите категорию")
            return
        }

        const data = {
            ...formData,
            images: images.map((img, i) => ({
                url: img.url,
                alt: img.alt || formData.name,
                displayOrder: i,
                isPrimary: img.isPrimary,
            })),
        }

        startTransition(async () => {
            const result = product
                ? await updateProduct(product.id, data)
                : await createProduct(data)

            if (result.error) {
                setError(result.error)
            } else {
                router.push("/admin/products")
                router.refresh()
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Название *</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Помидоры"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="slug">Слаг (URL) *</Label>
                    <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) =>
                            setFormData({ ...formData, slug: e.target.value })
                        }
                        placeholder="pomidory"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="categoryId">Категория *</Label>
                    <select
                        id="categoryId"
                        value={formData.categoryId}
                        onChange={(e) =>
                            setFormData({ ...formData, categoryId: e.target.value })
                        }
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        required
                    >
                        <option value="">Выберите категорию</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="originCountry">Страна происхождения</Label>
                    <Input
                        id="originCountry"
                        value={formData.originCountry}
                        onChange={(e) =>
                            setFormData({ ...formData, originCountry: e.target.value })
                        }
                        placeholder="Китай"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="shortDescription">Краткое описание</Label>
                <Input
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) =>
                        setFormData({ ...formData, shortDescription: e.target.value })
                    }
                    placeholder="Свежие помидоры из Китая"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Полное описание</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Подробное описание товара..."
                    rows={4}
                />
            </div>

            <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Варианты и упаковка</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="variantGroup">Группа вариаций</Label>
                        <Input
                            id="variantGroup"
                            value={formData.variantGroup}
                            onChange={(e) =>
                                setFormData({ ...formData, variantGroup: e.target.value })
                            }
                            placeholder="масло растительное"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="variationName">Значение варианта</Label>
                        <Input
                            id="variationName"
                            value={formData.variationName}
                            onChange={(e) =>
                                setFormData({ ...formData, variationName: e.target.value })
                            }
                            placeholder="0,87 л"
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="variationAttributes">Атрибуты варианта (ключ:значение | ключ:значение)</Label>
                        <Input
                            id="variationAttributes"
                            value={formData.variationAttributes}
                            onChange={(e) =>
                                setFormData({ ...formData, variationAttributes: e.target.value })
                            }
                            placeholder="объем:0.87л | тип:масло"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="packagingType">Тип упаковки</Label>
                        <Input
                            id="packagingType"
                            value={formData.packagingType}
                            onChange={(e) =>
                                setFormData({ ...formData, packagingType: e.target.value })
                            }
                            placeholder="Картонная коробка"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="packagingQuantity">В 1 коробке</Label>
                        <Input
                            id="packagingQuantity"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.packagingQuantity ?? ""}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    packagingQuantity: e.target.value
                                        ? parseFloat(e.target.value)
                                        : null,
                                })
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="packagingUnit">Единица вложимости</Label>
                        <select
                            id="packagingUnit"
                            value={formData.packagingUnit}
                            onChange={(e) =>
                                setFormData({ ...formData, packagingUnit: e.target.value })
                            }
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                            <option value="">Не указано</option>
                            <option value="KG">Килограмм</option>
                            <option value="PIECE">Штука</option>
                            <option value="BOX">Коробка</option>
                            <option value="BUNCH">Пучок</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Pricing */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Цены</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="price">Цена *</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    price: parseFloat(e.target.value) || 0,
                                })
                            }
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Order units */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Единицы заказа</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="unit">Единица измерения</Label>
                        <select
                            id="unit"
                            value={formData.unit}
                            onChange={(e) =>
                                setFormData({ ...formData, unit: e.target.value })
                            }
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                            <option value="KG">Килограмм</option>
                            <option value="PIECE">Штука</option>
                            <option value="BOX">Коробка</option>
                            <option value="BUNCH">Пучок</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="minOrderQuantity">Мин. заказ</Label>
                        <Input
                            id="minOrderQuantity"
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.minOrderQuantity}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    minOrderQuantity: parseFloat(e.target.value) || 1,
                                })
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="stepQuantity">Шаг количества</Label>
                        <Input
                            id="stepQuantity"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.stepQuantity}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    stepQuantity: parseFloat(e.target.value) || 0.1,
                                })
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Images */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Изображения</h3>
                <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Input
                            id="product-images"
                            type="file"
                            accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
                            multiple
                            disabled={isUploadingImages}
                            onChange={async (e) => {
                                await uploadImages(e.target.files)
                                e.currentTarget.value = ""
                            }}
                            className="max-w-md"
                        />
                        {isUploadingImages && (
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Загрузка...
                            </div>
                        )}
                    </div>
                    {imageUploadError && (
                        <p className="text-sm text-destructive">{imageUploadError}</p>
                    )}

                    {images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {images.map((image, index) => (
                                <div
                                    key={index}
                                    className="relative group border rounded-lg overflow-hidden"
                                >
                                    <img
                                        src={image.url}
                                        alt={image.alt || ""}
                                        className="w-full h-32 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={image.isPrimary ? "default" : "secondary"}
                                            onClick={() => setPrimaryImage(index)}
                                        >
                                            <Star className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => removeImage(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {image.isPrimary && (
                                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                            Главное
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Flags & Status */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Статус и метки</h3>
                <div className="flex flex-wrap items-center gap-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) =>
                                setFormData({ ...formData, isActive: e.target.checked })
                            }
                            className="w-4 h-4"
                        />
                        <span>Активен (виден в каталоге)</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isHit}
                            onChange={(e) =>
                                setFormData({ ...formData, isHit: e.target.checked })
                            }
                            className="w-4 h-4"
                        />
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>Хит продаж</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isNew}
                            onChange={(e) =>
                                setFormData({ ...formData, isNew: e.target.checked })
                            }
                            className="w-4 h-4"
                        />
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        <span>Новинка</span>
                    </label>
                </div>
            </div>

            {/* SEO */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">SEO</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="metaTitle">Мета-заголовок</Label>
                        <Input
                            id="metaTitle"
                            value={formData.metaTitle}
                            onChange={(e) =>
                                setFormData({ ...formData, metaTitle: e.target.value })
                            }
                            placeholder="Заголовок для поисковиков"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="metaDescription">Мета-описание</Label>
                        <Textarea
                            id="metaDescription"
                            value={formData.metaDescription}
                            onChange={(e) =>
                                setFormData({ ...formData, metaDescription: e.target.value })
                            }
                            placeholder="Описание для поисковиков"
                            rows={2}
                        />
                    </div>
                </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end space-x-2 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                >
                    Отмена
                </Button>
                <Button type="submit" disabled={isPending || isUploadingImages}>
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {product ? "Сохранить" : "Создать"}
                </Button>
            </div>
        </form>
    )
}
