import { NextRequest, NextResponse } from "next/server"
import { importBulkProductDraft } from "@/actions/admin/product-bulk"

type BulkDraftImportRouteContext = {
    params: Promise<{
        draftId: string
    }>
}

export async function POST(
    _request: NextRequest,
    context: BulkDraftImportRouteContext
) {
    try {
        const { draftId } = await context.params
        const result = await importBulkProductDraft(draftId)

        return NextResponse.json(result, {
            status: result.error ? 400 : 200,
        })
    } catch (error) {
        console.error("Import bulk product draft API error:", error)
        return NextResponse.json(
            { error: "Не удалось импортировать товары из черновика." },
            { status: 500 }
        )
    }
}
