import { NextRequest, NextResponse } from "next/server"
import { createBulkProductDraftFromFile } from "@/actions/admin/product-bulk"

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const result = await createBulkProductDraftFromFile(formData)

        return NextResponse.json(result, {
            status: result.error ? 400 : 200,
        })
    } catch (error) {
        console.error("Create bulk product draft API error:", error)
        return NextResponse.json(
            { error: "Не удалось обработать CSV-файл." },
            { status: 500 }
        )
    }
}
