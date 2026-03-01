import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
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
