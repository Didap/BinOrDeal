import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Bin or Deal — Aggregatore EU per collezionisti",
    template: "%s · Bin or Deal",
  },
  description:
    "Cerca contemporaneamente su eBay, Vinted, Wallapop e Subito. Ogni annuncio viene scorato contro il prezzo di mercato di Cardmarket e Numista — così vedi solo le occasioni reali.",
  openGraph: {
    title: "Bin or Deal",
    description:
      "Aggregatore marketplace EU con scoring automatico bin/fair/deal per collezionisti.",
    siteName: "Bin or Deal",
    type: "website",
    locale: "it_IT",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="antialiased">{children}</body>
    </html>
  )
}
