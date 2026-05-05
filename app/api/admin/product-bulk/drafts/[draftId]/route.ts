import { NextRequest, NextResponse } from "next/server"
import {
    deleteBulkProductDraft,
    saveBulkProductDraft,
} from "@/actions/admin/product-bulk"
import type { BulkProductDraftRow } from "@/lib/products/bulk-import"

type BulkDraftRouteContext = {
    params: Promise<{
        draftId: string
    }>
}

export async function PATCH(
    request: NextRequest,
    context: BulkDraftRouteContext
) {
    try {
        const { draftId } = await context.params
        const payload = await request.json() as {
            name?: unknown
            rows?: unknown
        }

        if (typeof payload.name !== "string" || !Array.isArray(payload.rows)) {
            return NextResponse.json(
                { error: "Некорректные данные черновика." },
                { status: 400 }
            )
        }

        const result = await saveBulkProductDraft(draftId, {
            name: payload.name,
            rows: payload.rows as BulkProductDraftRow[],
        })

        return NextResponse.json(result, {
            status: result.error ? 400 : 200,
        })
    } catch (error) {
        console.error("Save bulk product draft API error:", error)
        return NextResponse.json(
            { error: "Не удалось сохранить черновик." },
            { status: 500 }
        )
    }
}

export async function DELETE(
    _request: NextRequest,
    context: BulkDraftRouteContext
) {
    try {
        const { draftId } = await context.params
        const result = await deleteBulkProductDraft(draftId)

        return NextResponse.json(result, {
            status: result.error ? 400 : 200,
        })
    } catch (error) {
        console.error("Delete bulk product draft API error:", error)
        return NextResponse.json(
            { error: "Не удалось удалить черновик." },
            { status: 500 }
        )
    }
}
