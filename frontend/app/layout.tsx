import type { Metadata } from "next"
import "./globals.css"
import { FavoritesProvider } from "@/lib/favorites"

export const metadata: Metadata = {
  title: "Warsaw Beauty Salon Explorer",
  description: "Find the best hair & beauty salons across Warsaw",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <FavoritesProvider>{children}</FavoritesProvider>
      </body>
    </html>
  )
}
