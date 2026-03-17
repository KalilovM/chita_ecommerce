import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Upload } from "lucide-react"
import { ProductForm } from "../product-form"

async function getCategories() {
    return prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
    })
}

export default async function NewProductPage() {
    const categories = await getCategories()

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/admin/products">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Новый товар</h1>
                    <p className="text-muted-foreground">
                        Добавление нового товара в каталог
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader className="border-b bg-muted/30">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Bulk import from CSV</CardTitle>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Upload the spreadsheet, keep a saved draft, and import or update products in bulk.
                            </p>
                        </div>
                        <Link href="/admin/products/new/bulk">
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Open bulk import
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Данные товара</CardTitle>
                </CardHeader>
                <CardContent>
                    <ProductForm categories={categories} />
                </CardContent>
            </Card>
        </div>
    )
}
