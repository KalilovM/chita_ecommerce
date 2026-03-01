"use client"

import { Bell, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

interface AdminHeaderProps {
    user: {
        name: string
        email: string
        role: string
    }
}

export function AdminHeader({ user }: AdminHeaderProps) {
    return (
        <header className="h-16 border-b bg-card px-6 flex items-center justify-between">
            <div>
                <h1 className="text-lg font-semibold">Добро пожаловать, {user.name}</h1>
            </div>
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                </Button>
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        </header>
    )
}
