import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"
import { CategoryForm } from "../category-form"

interface PageProps {
    params: Promise<{ id: string }>
}

async function getCategory(id: string) {
    return prisma.category.findUnique({
        where: { id },
    })
}

async function getParentCategories(excludeId: string) {
    return prisma.category.findMany({
        where: {
            parentId: null,
            id: { not: excludeId },
        },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
    })
}

export default async function EditCategoryPage({ params }: PageProps) {
    const { id } = await params
    const [category, parentCategories] = await Promise.all([
        getCategory(id),
        getParentCategories(id),
    ])

    if (!category) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/admin/categories">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Редактировать категорию</h1>
                    <p className="text-muted-foreground">{category.name}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Данные категории</CardTitle>
                </CardHeader>
                <CardContent>
                    <CategoryForm
                        category={category}
                        parentCategories={parentCategories}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
