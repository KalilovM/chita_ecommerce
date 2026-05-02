import type { JsonValue } from "@prisma/client/runtime/library"
import {
    coerceBulkProductDraftRows,
    validateBulkProductRows,
    type BulkProductDraftIssue,
    type BulkProductDraftRow,
    type BulkProductDraftSummary,
} from "@/lib/products/bulk-import"

export interface BulkProductDraftListItem {
    id: string
    name: string
    sourceFileName: string | null
    rowCount: number
    status: string
    updatedAt: string
    lastImportedAt: string | null
}

export interface BulkProductDraftView extends BulkProductDraftListItem {
    rows: BulkProductDraftRow[]
    issues: BulkProductDraftIssue[]
    summary: BulkProductDraftSummary
    importSummary: JsonValue | null
}

interface DraftRecord {
    id: string
    name: string
    sourceFileName: string | null
    rowCount: number
    status: string
    rows: JsonValue
    updatedAt: Date
    lastImportedAt: Date | null
    importSummary: JsonValue | null
}

export function serializeBulkProductDraftListItem(draft: {
    id: string
    name: string
    sourceFileName: string | null
    rowCount: number
    status: string
    updatedAt: Date
    lastImportedAt: Date | null
}) {
    return {
        id: draft.id,
        name: draft.name,
        sourceFileName: draft.sourceFileName,
        rowCount: draft.rowCount,
        status: draft.status,
        updatedAt: draft.updatedAt.toISOString(),
        lastImportedAt: draft.lastImportedAt?.toISOString() ?? null,
    }
}

export function serializeBulkProductDraft(draft: DraftRecord): BulkProductDraftView {
    const rows = coerceBulkProductDraftRows(draft.rows)
    const { issues, summary } = validateBulkProductRows(rows)

    return {
        ...serializeBulkProductDraftListItem(draft),
        rows,
        issues,
        summary,
        importSummary: draft.importSummary,
    }
}
