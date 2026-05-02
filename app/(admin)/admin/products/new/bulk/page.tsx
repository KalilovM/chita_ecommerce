import Link from "next/link"
import { ArrowLeft, Upload } from "lucide-react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BulkProductImport } from "./bulk-product-import"
import {
    serializeBulkProductDraft,
    serializeBulkProductDraftListItem,
} from "@/lib/products/bulk-import-draft"

interface PageProps {
    searchParams: Promise<{
        draft?: string
    }>
}

export default async function BulkProductImportPage({ searchParams }: PageProps) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/login")
    }

    const params = await searchParams
    const [drafts, selectedDraft] = await Promise.all([
        prisma.bulkProductDraft.findMany({
            where: {
                createdById: session.user.id,
            },
            orderBy: {
                updatedAt: "desc",
            },
            take: 12,
        }),
        params.draft
            ? prisma.bulkProductDraft.findFirst({
                where: {
                    id: params.draft,
                    createdById: session.user.id,
                },
            })
            : null,
    ])

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products/new">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Массовый импорт товаров</h1>
                        <p className="text-muted-foreground">
                            Загрузите CSV-файл, проверьте черновик и импортируйте/обновите товары за один проход.
                        </p>
                    </div>
                </div>
                <Link href="/admin/products/new">
                    <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Вернуться к форме одного товара
                    </Button>
                </Link>
            </div>

            <BulkProductImport
                initialDrafts={drafts.map(serializeBulkProductDraftListItem)}
                initialDraft={selectedDraft ? serializeBulkProductDraft(selectedDraft) : null}
            />
        </div>
    )
}
