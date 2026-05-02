"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    createEmptyBulkProductRow,
    type BulkProductDraftIssue,
    type BulkProductDraftRow,
} from "@/lib/products/bulk-import"
import type {
    BulkProductDraftListItem,
    BulkProductDraftView,
} from "@/lib/products/bulk-import-draft"
import {
    createBulkProductDraftFromFile,
    deleteBulkProductDraft,
    importBulkProductDraft,
    saveBulkProductDraft,
} from "@/actions/admin/product-bulk"
import {
    AlertTriangle,
    CheckCircle2,
    Download,
    FileSpreadsheet,
    Loader2,
    Plus,
    Trash2,
    Upload,
} from "lucide-react"

interface BulkProductImportProps {
    initialDrafts: BulkProductDraftListItem[]
    initialDraft: BulkProductDraftView | null
}

type SaveState = "idle" | "saving" | "saved" | "error"

const unitOptions = [
    { value: "KG", label: "кг" },
    { value: "PIECE", label: "шт" },
    { value: "BOX", label: "кор" },
    { value: "BUNCH", label: "пуч" },
] as const

const csvFieldReference = [
    { column: "Ключ импорта", description: "Уникальный ключ для обновления существующего товара.", example: "oil-sunflower-087" },
    { column: "Номенклатура, Единица", description: "Название товара. Если в названии есть 0,87 л / 4,8 л, вариация создастся автоматически.", example: "масло растительное 0,87 л" },
    { column: "Слаг (URL)", description: "URL-идентификатор. Если пусто, будет сгенерирован автоматически.", example: "maslo-rastitelnoe-0-87-l" },
    { column: "Группа вариаций", description: "Общий идентификатор группы вариантов одного товара.", example: "масло растительное" },
    { column: "Вариант", description: "Значение варианта (например объем).", example: "0,87 л" },
    { column: "Атрибуты варианта", description: "Пары ключ:значение через |.", example: "объем:0.87л | тип:масло" },
    { column: "Категория", description: "Одна категория или путь с подкатегорией.", example: "Фрукты > Виноград" },
    { column: "Описание товара", description: "Полное описание на карточке товара.", example: "Рафинированное масло для жарки и салатов." },
    { column: "Краткое описание", description: "Короткий подзаголовок в каталоге.", example: "Подходит для HoReCa" },
    { column: "Цена", description: "Необязательное поле. Пусто: при обновлении сохранится текущая цена, при создании станет 0.", example: "345" },
    { column: "Единица измерения", description: "Допустимо: кг, шт, кор, пуч.", example: "шт" },
    { column: "Минимальный заказ", description: "Минимальное количество к заказу.", example: "1" },
    { column: "Шаг количества", description: "Кратность добавления в корзину.", example: "0,1" },
    { column: "Страна", description: "Страна происхождения.", example: "Россия" },
    { column: "Вид упаковки", description: "Тип тары/упаковки.", example: "Картонная коробка" },
    { column: "Вложимость в 1 коробке", description: "Сколько товара в одной коробке.", example: "12" },
    { column: "Единица вложимости", description: "Единица для вложимости. Если пусто, берется из единицы товара.", example: "шт" },
    { column: "Ссылки на фото", description: "Ссылки через | или запятую.", example: "https://site/img1.jpg | https://site/img2.jpg" },
    { column: "Активен", description: "Показывать товар в магазине.", example: "1" },
    { column: "Хит", description: "Маркер хита продаж.", example: "0" },
    { column: "Новинка", description: "Маркер новинки.", example: "1" },
    { column: "Мета заголовок", description: "SEO заголовок страницы товара.", example: "Масло растительное 0,87 л" },
    { column: "Мета описание", description: "SEO описание страницы товара.", example: "Оптовые поставки масла с доставкой." },
] as const

export function BulkProductImport({
    initialDrafts,
    initialDraft,
}: BulkProductImportProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [drafts, setDrafts] = useState(initialDrafts)
    const [selectedDraft, setSelectedDraft] = useState(initialDraft)
    const [draftName, setDraftName] = useState(initialDraft?.name ?? "")
    const [rows, setRows] = useState<BulkProductDraftRow[]>(initialDraft?.rows ?? [])
    const [issues, setIssues] = useState<BulkProductDraftIssue[]>(initialDraft?.issues ?? [])
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [saveState, setSaveState] = useState<SaveState>("idle")
    const [hasLocalChanges, setHasLocalChanges] = useState(false)

    useEffect(() => {
        setDrafts(initialDrafts)
    }, [initialDrafts])

    useEffect(() => {
        setSelectedDraft(initialDraft)
        setDraftName(initialDraft?.name ?? "")
        setRows(initialDraft?.rows ?? [])
        setIssues(initialDraft?.issues ?? [])
        setHasLocalChanges(false)
        setSaveState("idle")
    }, [initialDraft])

    useEffect(() => {
        if (!selectedDraft?.id || !hasLocalChanges) {
            return
        }

        setSaveState("saving")
        const timeoutId = window.setTimeout(() => {
            void saveBulkProductDraft(selectedDraft.id, {
                name: draftName,
                rows,
            }).then((result) => {
                if (result.error || !result.draft) {
                    setSaveState("error")
                    setErrorMessage(result.error ?? "Не удалось сохранить черновик.")
                    return
                }

                setSelectedDraft(result.draft)
                setDraftName(result.draft.name)
                setRows(result.draft.rows)
                setIssues(result.draft.issues)
                setDrafts((currentDrafts) => upsertDraft(currentDrafts, result.draft))
                setHasLocalChanges(false)
                setSaveState("saved")
            })
        }, 900)

        return () => window.clearTimeout(timeoutId)
    }, [draftName, rows, selectedDraft?.id, hasLocalChanges])

    const issuesByRow = useMemo(() => {
        const map = new Map<string, BulkProductDraftIssue[]>()
        issues.forEach((issue) => {
            const currentIssues = map.get(issue.rowId) ?? []
            currentIssues.push(issue)
            map.set(issue.rowId, currentIssues)
        })
        return map
    }, [issues])

    const summary = selectedDraft?.summary ?? {
        totalRows: rows.length,
        validRows: rows.length,
        invalidRows: 0,
        errorCount: 0,
        warningCount: 0,
    }

    const updateDraftSelection = (draft: BulkProductDraftView) => {
        setSelectedDraft(draft)
        setDraftName(draft.name)
        setRows(draft.rows)
        setIssues(draft.issues)
        setDrafts((currentDrafts) => upsertDraft(currentDrafts, draft))
        setHasLocalChanges(false)
        setSaveState("idle")
        router.replace(`/admin/products/new/bulk?draft=${draft.id}`)
    }

    const handleUpload = (file: File | null) => {
        if (!file) {
            return
        }

        setStatusMessage(null)
        setErrorMessage(null)

        startTransition(async () => {
            const formData = new FormData()
            formData.set("file", file)

            const result = await createBulkProductDraftFromFile(formData)

            if (result.error || !result.draft) {
                setErrorMessage(result.error ?? "Не удалось создать черновик из файла.")
                return
            }

            updateDraftSelection(result.draft)
            setStatusMessage(`Черновик «${result.draft.name}» создан из файла ${file.name}.`)
        })
    }

    const handleDeleteDraft = (draftId: string) => {
        setStatusMessage(null)
        setErrorMessage(null)

        startTransition(async () => {
            const result = await deleteBulkProductDraft(draftId)

            if (result.error) {
                setErrorMessage(result.error)
                return
            }

            const nextDrafts = drafts.filter((draft) => draft.id !== draftId)
            setDrafts(nextDrafts)

            if (selectedDraft?.id === draftId) {
                setSelectedDraft(null)
                setDraftName("")
                setRows([])
                setIssues([])
                router.replace("/admin/products/new/bulk")
            }

            setStatusMessage("Черновик удален.")
        })
    }

    const handleImport = () => {
        if (!selectedDraft) {
            return
        }

        setStatusMessage(null)
        setErrorMessage(null)

        startTransition(async () => {
            const result = await importBulkProductDraft(selectedDraft.id)

            if (result.error) {
                setErrorMessage(result.error)
                return
            }

            if (result.draft) {
                updateDraftSelection(result.draft)
            }

            if (result.importSummary) {
                setStatusMessage(
                    `Импорт завершен: создано ${result.importSummary.created}, обновлено ${result.importSummary.updated}, создано категорий ${result.importSummary.categoriesCreated}.`
                )
            } else {
                setStatusMessage("Импорт завершен.")
            }

            router.refresh()
        })
    }

    const handleSelectDraft = (draft: BulkProductDraftListItem) => {
        if (selectedDraft?.id === draft.id) {
            return
        }

        setStatusMessage(null)
        setErrorMessage(null)
        router.replace(`/admin/products/new/bulk?draft=${draft.id}`)
    }

    const updateRow = (
        rowId: string,
        updater: (currentRow: BulkProductDraftRow) => BulkProductDraftRow
    ) => {
        setRows((currentRows) =>
            currentRows.map((row) => (row.id === rowId ? updater(row) : row))
        )
        setHasLocalChanges(true)
        setSaveState("idle")
    }

    const removeRow = (rowId: string) => {
        setRows((currentRows) => currentRows.filter((row) => row.id !== rowId))
        setHasLocalChanges(true)
        setSaveState("idle")
    }

    const addRow = () => {
        setRows((currentRows) => [
            ...currentRows,
            createEmptyBulkProductRow(currentRows.length),
        ])
        setHasLocalChanges(true)
        setSaveState("idle")
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Upload className="h-5 w-5" />
                            Загрузка CSV
                        </CardTitle>
                        <CardDescription>
                            Загрузите `products.csv` или шаблон с этой страницы. Импорт
                            нормализует вариации, вложимость коробки и сохранит черновик.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Label htmlFor="bulk-products-file">CSV-файл</Label>
                        <Input
                            id="bulk-products-file"
                            type="file"
                            accept=".csv,text/csv"
                            disabled={isPending}
                            onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
                        />
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/templates/bulk-products-template.csv" download>
                                <Download className="mr-2 h-4 w-4" />
                                Скачать шаблон
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <FileSpreadsheet className="h-5 w-5" />
                            Сохраненные черновики
                        </CardTitle>
                        <CardDescription>
                            Можно уйти со страницы и продолжить импорт позже из того же черновика.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {drafts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Черновиков пока нет. Загрузите CSV-файл, чтобы создать первый.
                            </p>
                        ) : (
                            drafts.map((draft) => (
                                <button
                                    key={draft.id}
                                    type="button"
                                    onClick={() => handleSelectDraft(draft)}
                                    className={`w-full rounded-lg border p-4 text-left transition-colors ${
                                        selectedDraft?.id === draft.id
                                            ? "border-primary bg-primary/5"
                                            : "hover:bg-muted/50"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium">{draft.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {draft.sourceFileName ?? "Черновик вручную"}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={draft.status === "IMPORTED" ? "success" : "outline"}
                                        >
                                            {draft.status === "IMPORTED" ? "Импортирован" : "Черновик"}
                                        </Badge>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{draft.rowCount} строк</span>
                                        <span>{new Date(draft.updatedAt).toLocaleString()}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader className="space-y-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <CardTitle className="text-xl">Черновик массового импорта</CardTitle>
                            <CardDescription>
                                Существующие товары ищутся сначала по ключу импорта, затем по slug.
                                Варианты (например 0,87 л / 4,8 л / 5,0 л) группируются автоматически.
                            </CardDescription>
                        </div>
                        {selectedDraft && (
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    variant={summary.invalidRows > 0 ? "destructive" : "success"}
                                >
                                    {summary.invalidRows > 0
                                        ? `Строк с ошибками: ${summary.invalidRows}`
                                        : "Готово к импорту"}
                                </Badge>
                                <Badge variant="outline">
                                    {saveState === "saving"
                                        ? "Сохранение..."
                                        : saveState === "saved"
                                            ? "Сохранено"
                                            : "Не сохранено"}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {statusMessage && (
                        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                            {statusMessage}
                        </div>
                    )}

                    {errorMessage && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {errorMessage}
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {selectedDraft ? (
                        <>
                            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                                <div className="space-y-2">
                                    <Label htmlFor="draft-name">Название черновика</Label>
                                    <Input
                                        id="draft-name"
                                        value={draftName}
                                        onChange={(event) => {
                                            setDraftName(event.target.value)
                                            setHasLocalChanges(true)
                                            setSaveState("idle")
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Строки</Label>
                                    <div className="flex h-10 items-center rounded-md border px-3 text-sm">
                                        {rows.length}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Статус</Label>
                                    <div className="flex h-10 items-center rounded-md border px-3 text-sm">
                                        {selectedDraft.status === "IMPORTED" ? "Импортирован" : "Черновик"}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-4">
                                <SummaryCard title="Всего строк" value={summary.totalRows} icon={FileSpreadsheet} />
                                <SummaryCard title="Валидные" value={summary.validRows} icon={CheckCircle2} />
                                <SummaryCard title="Ошибки" value={summary.errorCount} icon={AlertTriangle} />
                                <SummaryCard title="Предупреждения" value={summary.warningCount} icon={AlertTriangle} />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button type="button" variant="outline" onClick={addRow}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Добавить строку
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleDeleteDraft(selectedDraft.id)}
                                    disabled={isPending}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Удалить черновик
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleImport}
                                    disabled={isPending || summary.invalidRows > 0 || rows.length === 0}
                                >
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Импортировать товары
                                </Button>
                            </div>

                            <div className="rounded-lg border bg-muted/30 p-4">
                                <h3 className="text-sm font-semibold">Поля CSV и формат заполнения</h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Шаблон содержит эти же колонки. Поддерживаются и русские, и английские заголовки, но рекомендован русский шаблон.
                                </p>
                                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                    {csvFieldReference.map((field) => (
                                        <div key={field.column} className="rounded-md border bg-background p-3">
                                            <p className="text-sm font-medium">{field.column}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{field.description}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">Пример: {field.example}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {rows.map((row, index) => {
                                    const rowIssues = issuesByRow.get(row.id) ?? []
                                    const rowErrors = rowIssues.filter((issue) => issue.severity === "error")
                                    const rowWarnings = rowIssues.filter((issue) => issue.severity === "warning")

                                    return (
                                        <details key={row.id} className="rounded-lg border" open={index < 3}>
                                            <summary className="cursor-pointer list-none p-4">
                                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-medium">
                                                                {row.name || `Строка ${index + 1}`}
                                                            </span>
                                                            {rowErrors.length > 0 && (
                                                                <Badge variant="destructive">
                                                                    Ошибки: {rowErrors.length}
                                                                </Badge>
                                                            )}
                                                            {rowWarnings.length > 0 && (
                                                                <Badge variant="warning">
                                                                    Предупреждения: {rowWarnings.length}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            {row.categoryPath || "Без категории"} · {row.slug || "Без слага"} · {row.price || "Без цены"}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline">{row.unit}</Badge>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(event) => {
                                                                event.preventDefault()
                                                                removeRow(row.id)
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </summary>
                                            <div className="border-t p-4">
                                                <div className="grid gap-4 xl:grid-cols-2">
                                                    <FieldGroup label="Ключ импорта">
                                                        <Input
                                                            value={row.importKey}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    importKey: event.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </FieldGroup>
                                                    <FieldGroup label="Слаг (URL)">
                                                        <Input
                                                            value={row.slug}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    slug: event.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </FieldGroup>
                                                    <FieldGroup label="Название товара">
                                                        <Input
                                                            value={row.name}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    name: event.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </FieldGroup>
                                                    <FieldGroup label="Путь категории">
                                                        <Input
                                                            value={row.categoryPath}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    categoryPath: event.target.value,
                                                                }))
                                                            }
                                                            placeholder="Фрукты > Виноград"
                                                        />
                                                    </FieldGroup>
                                                    <FieldGroup label="Группа вариаций">
                                                        <Input
                                                            value={row.variantGroup}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    variantGroup: event.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </FieldGroup>
                                                    <FieldGroup label="Вариант">
                                                        <Input
                                                            value={row.variationName}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    variationName: event.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </FieldGroup>
                                                    <FieldGroup label="Цена">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={row.price}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    price: event.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </FieldGroup>
                                                    <FieldGroup label="Единица">
                                                        <select
                                                            value={row.unit}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    unit: event.target.value as BulkProductDraftRow["unit"],
                                                                }))
                                                            }
                                                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                        >
                                                            {unitOptions.map((unitOption) => (
                                                                <option key={unitOption.value} value={unitOption.value}>
                                                                    {unitOption.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </FieldGroup>
                                                    <FieldGroup label="Минимальный заказ">
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            value={row.minOrderQuantity}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    minOrderQuantity: event.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </FieldGroup>
                                                    <FieldGroup label="Шаг количества">
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            value={row.stepQuantity}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    stepQuantity: event.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </FieldGroup>
                                                    <FieldGroup label="Страна">
                                                        <Input
                                                            value={row.originCountry}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    originCountry: event.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </FieldGroup>
                                                    <FieldGroup label="Ссылки на фото">
                                                        <Textarea
                                                            rows={3}
                                                            value={row.imageUrls}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    imageUrls: event.target.value,
                                                                }))
                                                            }
                                                            placeholder="https://... | https://..."
                                                        />
                                                    </FieldGroup>
                                                </div>

                                                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                                    <FieldGroup label="Атрибуты варианта">
                                                        <Input
                                                            value={row.variationAttributes}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    variationAttributes: event.target.value,
                                                                }))
                                                            }
                                                            placeholder="объем:0.87л | тип:масло"
                                                        />
                                                    </FieldGroup>
                                                    <FieldGroup label="Вид упаковки">
                                                        <Input
                                                            value={row.packagingType}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    packagingType: event.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </FieldGroup>
                                                    <FieldGroup label="Вложимость в 1 коробке">
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            value={row.packagingQuantity}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    packagingQuantity: event.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </FieldGroup>
                                                    <FieldGroup label="Единица вложимости">
                                                        <select
                                                            value={row.packagingUnit}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    packagingUnit: event.target.value as BulkProductDraftRow["packagingUnit"],
                                                                }))
                                                            }
                                                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                        >
                                                            <option value="">Не указано</option>
                                                            {unitOptions.map((unitOption) => (
                                                                <option key={unitOption.value} value={unitOption.value}>
                                                                    {unitOption.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </FieldGroup>
                                                    <FieldGroup label="Краткое описание">
                                                        <Textarea
                                                            rows={3}
                                                            value={row.shortDescription}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    shortDescription: event.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </FieldGroup>
                                                    <FieldGroup label="Описание товара">
                                                        <Textarea
                                                            rows={3}
                                                            value={row.description}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    description: event.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </FieldGroup>
                                                </div>

                                                <div className="mt-4 flex flex-wrap gap-6">
                                                    <CheckboxField
                                                        label="Активен"
                                                        checked={row.isActive}
                                                        onChange={(checked) =>
                                                            updateRow(row.id, (currentRow) => ({
                                                                ...currentRow,
                                                                isActive: checked,
                                                            }))
                                                        }
                                                    />
                                                    <CheckboxField
                                                        label="Хит"
                                                        checked={row.isHit}
                                                        onChange={(checked) =>
                                                            updateRow(row.id, (currentRow) => ({
                                                                ...currentRow,
                                                                isHit: checked,
                                                            }))
                                                        }
                                                    />
                                                    <CheckboxField
                                                        label="Новинка"
                                                        checked={row.isNew}
                                                        onChange={(checked) =>
                                                            updateRow(row.id, (currentRow) => ({
                                                                ...currentRow,
                                                                isNew: checked,
                                                            }))
                                                        }
                                                    />
                                                </div>

                                                {rowIssues.length > 0 && (
                                                    <div className="mt-4 space-y-2 rounded-md border bg-muted/40 p-4">
                                                        <p className="text-sm font-medium">Проблемы строки</p>
                                                        {rowIssues.map((issue, issueIndex) => (
                                                            <div
                                                                key={`${issue.field}-${issueIndex}`}
                                                                className={`text-sm ${
                                                                    issue.severity === "error"
                                                                        ? "text-red-700"
                                                                        : "text-yellow-700"
                                                                }`}
                                                            >
                                                                {issue.message}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </details>
                                    )
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-lg border border-dashed p-10 text-center">
                            <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground" />
                            <p className="mt-4 text-lg font-medium">Черновик не выбран</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Загрузите CSV-файл или выберите сохраненный черновик для продолжения.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function upsertDraft(
    drafts: BulkProductDraftListItem[],
    draft: BulkProductDraftView
) {
    const nextDrafts = drafts.filter((currentDraft) => currentDraft.id !== draft.id)
    return [
        {
            id: draft.id,
            name: draft.name,
            sourceFileName: draft.sourceFileName,
            rowCount: draft.rowCount,
            status: draft.status,
            updatedAt: draft.updatedAt,
            lastImportedAt: draft.lastImportedAt,
        },
        ...nextDrafts,
    ]
}

function SummaryCard({
    title,
    value,
    icon: Icon,
}: {
    title: string
    value: number
    icon: typeof FileSpreadsheet
}) {
    return (
        <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{title}</span>
                <Icon className="h-4 w-4" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
    )
}

function FieldGroup({
    label,
    className,
    children,
}: {
    label: string
    className?: string
    children: React.ReactNode
}) {
    return (
        <div className={className}>
            <Label className="mb-2 block">{label}</Label>
            {children}
        </div>
    )
}

function CheckboxField({
    label,
    checked,
    onChange,
}: {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
}) {
    return (
        <label className="flex items-center gap-2 text-sm">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4"
            />
            <span>{label}</span>
        </label>
    )
}
