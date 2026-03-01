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
    default: "СвежиеОвощи - Свежие овощи и фрукты с доставкой в Чите",
    template: "%s | СвежиеОвощи",
  },
  description:
    "Интернет-магазин свежих овощей и фруктов из Китая с доставкой по Чите. Розничная и оптовая продажа. Низкие цены, высокое качество.",
  keywords: [
    "овощи",
    "фрукты",
    "доставка",
    "Чита",
    "свежие продукты",
    "оптом",
    "китайские овощи",
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
