"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserRegistrationSchema, type UserRegistrationData } from "@/lib/validators/user"
import { registerUser } from "@/actions/auth"

export function RegisterForm() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<UserRegistrationData>({
        resolver: zodResolver(UserRegistrationSchema),
    })

    const onSubmit = async (data: UserRegistrationData) => {
        setError(null)

        try {
            const result = await registerUser(data)

            if (result.error) {
                setError(result.error)
                return
            }

            // Auto sign in after registration
            const signInResult = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            })

            if (signInResult?.error) {
                router.push("/login")
                return
            }

            router.push("/")
            router.refresh()
        } catch (error) {
            setError("Произошла ошибка. Попробуйте позже.")
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input
                    id="name"
                    placeholder="Иван Иванов"
                    {...register("name")}
                />
                {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    {...register("email")}
                />
                {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone">Телефон (необязательно)</Label>
                <Input
                    id="phone"
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    {...register("phone")}
                />
                {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                />
                {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Зарегистрироваться
            </Button>

            <p className="text-xs text-center text-muted-foreground">
                Регистрируясь, вы соглашаетесь с{" "}
                <Link href="/terms" className="text-primary hover:underline">
                    условиями использования
                </Link>{" "}
                и{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                    политикой конфиденциальности
                </Link>
            </p>
        </form>
    )
}

function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    return (
        <a href={href} className={className}>
            {children}
        </a>
    )
}
