import Link from "next/link"
import { Phone, Mail, MapPin, Clock } from "lucide-react"

interface Category {
    id: string
    name: string
    slug: string
}

interface FooterProps {
    categories?: Category[]
    settings?: Record<string, string>
}

export function Footer({ categories = [], settings = {} }: FooterProps) {
    const phone = settings.phone || "+7 (3022) 00-00-00"
    const email = settings.email || "info@freshproduce.ru"
    const address = settings.address || "г. Чита, ул. Примерная, д. 1"
    const workingDays = settings.workingDays || "Пн-Вс"
    const workingHours = settings.workingHoursWeekdays || "8:00 - 20:00"
    const footerText = settings.footerText || "Свежие овощи и фрукты из Китая с доставкой по Чите. Розничная и оптовая продажа."
    const copyrightText = settings.copyrightText || "СвежиеОвощи. Все права защищены."
    const siteName = settings.siteName || "СвежиеОвощи"

    // Show first 4 categories in footer
    const footerCategories = categories.slice(0, 4)

    return (
        <footer className="border-t bg-muted/50">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="text-2xl">🥬</span>
                            <span className="text-xl font-bold text-primary">
                                {siteName}
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            {footerText}
                        </p>
                    </div>

                    {/* Navigation */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Каталог</h3>
                        <ul className="space-y-2">
                            {footerCategories.map((category) => (
                                <li key={category.id}>
                                    <Link
                                        href={`/catalog/${category.slug}`}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {category.name}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link
                                    href="/catalog"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Все товары
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Покупателям</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/delivery"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Доставка
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/payment"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Оплата
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/wholesale"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Оптовым покупателям
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/contacts"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Контакты
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Контакты</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <a
                                    href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {phone}
                                </a>
                            </li>
                            <li className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <a
                                    href={`mailto:${email}`}
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {email}
                                </a>
                            </li>
                            <li className="flex items-start space-x-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span className="text-sm text-muted-foreground">
                                    {address}
                                </span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {workingDays}: {workingHours}
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-8 pt-8 border-t">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} {copyrightText}
                        </p>
                        <div className="flex space-x-4">
                            <Link
                                href="/privacy"
                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                Политика конфиденциальности
                            </Link>
                            <Link
                                href="/terms"
                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                Пользовательское соглашение
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
