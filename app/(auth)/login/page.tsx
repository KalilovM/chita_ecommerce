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
                <CardTitle>Вход в аккаунт</CardTitle>
                <CardDescription>
                    Введите email и пароль для входа
                </CardDescription>
            </CardHeader>
            <CardContent>
                <LoginForm />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <div className="text-sm text-center text-muted-foreground">
                    Нет аккаунта?{" "}
                    <Link href="/register" className="text-primary hover:underline">
                        Зарегистрироваться
                    </Link>
                </div>
                <Link
                    href="/forgot-password"
                    className="text-sm text-center text-muted-foreground hover:text-primary"
                >
                    Забыли пароль?
                </Link>
            </CardFooter>
        </Card>
    )
}

export const metadata = {
    title: "Вход",
}
