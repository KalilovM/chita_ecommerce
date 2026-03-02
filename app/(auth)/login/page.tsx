import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "./login-form"

export default async function LoginPage() {
    const session = await auth()

    if (session?.user) {
        redirect("/")
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <Link href="/" className="flex items-center justify-center space-x-2 mb-4">
                    <span className="text-3xl">🥬</span>
                    <span className="text-2xl font-bold text-primary">СвежиеОвощи</span>
                </Link>
                <CardTitle>Вход для партнёров</CardTitle>
                <CardDescription>
                    Введите email и пароль, чтобы управлять оптовыми заказами
                </CardDescription>
            </CardHeader>
            <CardContent>
                <LoginForm />
            </CardContent>
            <CardFooter>
                <div className="text-sm text-center text-muted-foreground">
                    Нет аккаунта?{" "}
                    <Link href="/register" className="text-primary hover:underline">
                        Подключиться
                    </Link>
                </div>
            </CardFooter>
        </Card>
    )
}

export const metadata = {
    title: "Вход",
}
