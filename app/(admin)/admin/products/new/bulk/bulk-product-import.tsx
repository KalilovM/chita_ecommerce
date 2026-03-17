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
                    setErrorMessage(result.error ?? "Failed to save the draft.")
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
                setErrorMessage(result.error ?? "Failed to create a draft from the file.")
                return
            }

            updateDraftSelection(result.draft)
            setStatusMessage(`Draft "${result.draft.name}" was created from ${file.name}.`)
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

            setStatusMessage("Draft deleted.")
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
                    `Import finished: ${result.importSummary.created} created, ${result.importSummary.updated} updated, ${result.importSummary.categoriesCreated} categories created.`
                )
            } else {
                setStatusMessage("Import finished.")
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
                            Upload CSV
                        </CardTitle>
                        <CardDescription>
                            Upload the admin template or the old draft CSV. The importer will
                            normalize the rows and store a resumable draft on the server.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Label htmlFor="bulk-products-file">CSV file</Label>
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
                                Download template
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <FileSpreadsheet className="h-5 w-5" />
                            Saved drafts
                        </CardTitle>
                        <CardDescription>
                            Leave the page any time and continue from the same draft later.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {drafts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No drafts yet. Upload a CSV file to create one.
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
                                                {draft.sourceFileName ?? "Manual draft"}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={draft.status === "IMPORTED" ? "success" : "outline"}
                                        >
                                            {draft.status === "IMPORTED" ? "Imported" : "Draft"}
                                        </Badge>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{draft.rowCount} rows</span>
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
                            <CardTitle className="text-xl">Bulk product draft</CardTitle>
                            <CardDescription>
                                Existing products are matched by import key first and slug second.
                            </CardDescription>
                        </div>
                        {selectedDraft && (
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    variant={summary.invalidRows > 0 ? "destructive" : "success"}
                                >
                                    {summary.invalidRows > 0
                                        ? `${summary.invalidRows} invalid rows`
                                        : "Ready to import"}
                                </Badge>
                                <Badge variant="outline">
                                    {saveState === "saving"
                                        ? "Saving..."
                                        : saveState === "saved"
                                            ? "Saved"
                                            : "Not saved"}
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
                                    <Label htmlFor="draft-name">Draft name</Label>
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
                                    <Label>Rows</Label>
                                    <div className="flex h-10 items-center rounded-md border px-3 text-sm">
                                        {rows.length}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <div className="flex h-10 items-center rounded-md border px-3 text-sm">
                                        {selectedDraft.status === "IMPORTED" ? "Imported" : "Draft"}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-4">
                                <SummaryCard title="Total rows" value={summary.totalRows} icon={FileSpreadsheet} />
                                <SummaryCard title="Valid rows" value={summary.validRows} icon={CheckCircle2} />
                                <SummaryCard title="Errors" value={summary.errorCount} icon={AlertTriangle} />
                                <SummaryCard title="Warnings" value={summary.warningCount} icon={AlertTriangle} />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button type="button" variant="outline" onClick={addRow}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add row
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleDeleteDraft(selectedDraft.id)}
                                    disabled={isPending}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete draft
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleImport}
                                    disabled={isPending || summary.invalidRows > 0 || rows.length === 0}
                                >
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Import products
                                </Button>
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
                                                                {row.name || `Row ${index + 1}`}
                                                            </span>
                                                            {rowErrors.length > 0 && (
                                                                <Badge variant="destructive">
                                                                    {rowErrors.length} errors
                                                                </Badge>
                                                            )}
                                                            {rowWarnings.length > 0 && (
                                                                <Badge variant="warning">
                                                                    {rowWarnings.length} warnings
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            {row.categoryPath || "No category"} · {row.slug || "No slug"} · {row.price || "No price"}
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
                                                    <FieldGroup label="Import key">
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
                                                    <FieldGroup label="Slug">
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
                                                    <FieldGroup label="Product name">
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
                                                    <FieldGroup label="Category path">
                                                        <Input
                                                            value={row.categoryPath}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    categoryPath: event.target.value,
                                                                }))
                                                            }
                                                            placeholder="Fruits > Grapes"
                                                        />
                                                    </FieldGroup>
                                                    <FieldGroup label="Variation group">
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
                                                    <FieldGroup label="Variation name">
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
                                                    <FieldGroup label="Price">
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
                                                    <FieldGroup label="Unit">
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
                                                    <FieldGroup label="Min order quantity">
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
                                                    <FieldGroup label="Step quantity">
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
                                                    <FieldGroup label="Origin country">
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
                                                    <FieldGroup label="Image URLs">
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
                                                    <FieldGroup label="Variation attributes">
                                                        <Input
                                                            value={row.variationAttributes}
                                                            onChange={(event) =>
                                                                updateRow(row.id, (currentRow) => ({
                                                                    ...currentRow,
                                                                    variationAttributes: event.target.value,
                                                                }))
                                                            }
                                                            placeholder="color:green | variety:kish-mish"
                                                        />
                                                    </FieldGroup>
                                                    <FieldGroup label="Packaging type">
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
                                                    <FieldGroup label="Packaging quantity">
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
                                                    <FieldGroup label="Packaging unit">
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
                                                            <option value="">Not set</option>
                                                            {unitOptions.map((unitOption) => (
                                                                <option key={unitOption.value} value={unitOption.value}>
                                                                    {unitOption.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </FieldGroup>
                                                    <FieldGroup label="Short description">
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
                                                    <FieldGroup label="Description">
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
                                                        label="Active"
                                                        checked={row.isActive}
                                                        onChange={(checked) =>
                                                            updateRow(row.id, (currentRow) => ({
                                                                ...currentRow,
                                                                isActive: checked,
                                                            }))
                                                        }
                                                    />
                                                    <CheckboxField
                                                        label="Featured"
                                                        checked={row.isHit}
                                                        onChange={(checked) =>
                                                            updateRow(row.id, (currentRow) => ({
                                                                ...currentRow,
                                                                isHit: checked,
                                                            }))
                                                        }
                                                    />
                                                    <CheckboxField
                                                        label="New"
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
                                                        <p className="text-sm font-medium">Row issues</p>
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
                            <p className="mt-4 text-lg font-medium">No draft selected</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Upload a CSV file or select one of the saved drafts to continue.
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
