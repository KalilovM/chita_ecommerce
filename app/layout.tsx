import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/providers"

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: {
    default: "СвежиеОвощи - Оптовые поставки овощей и фруктов в Чите",
    template: "%s | СвежиеОвощи",
  },
  description:
    "Оптовые поставки свежих овощей и фруктов для магазинов, кафе и HoReCa в Чите. Быстрая отгрузка, понятный каталог, прямое согласование заказа.",
  keywords: [
    "овощи",
    "фрукты",
    "оптовые поставки",
    "Чита",
    "свежие продукты",
    "оптом",
    "horeca",
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
