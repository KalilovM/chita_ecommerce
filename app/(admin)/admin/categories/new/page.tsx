import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { CategoryForm } from "../category-form"

async function getParentCategories() {
    return prisma.category.findMany({
        where: { parentId: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
    })
}

export default async function NewCategoryPage() {
    const parentCategories = await getParentCategories()

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/admin/categories">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Новая категория</h1>
                    <p className="text-muted-foreground">
                        Создание новой категории товаров
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Данные категории</CardTitle>
                </CardHeader>
                <CardContent>
                    <CategoryForm parentCategories={parentCategories} />
                </CardContent>
            </Card>
        </div>
    )
}
