import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RegisterForm } from "./register-form"

export default async function RegisterPage() {
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
                <CardTitle>Регистрация</CardTitle>
                <CardDescription>
                    Создайте аккаунт для оформления заказов
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RegisterForm />
            </CardContent>
            <CardFooter>
                <div className="text-sm text-center w-full text-muted-foreground">
                    Уже есть аккаунт?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                        Войти
                    </Link>
                </div>
            </CardFooter>
        </Card>
    )
}

export const metadata = {
    title: "Регистрация",
}
