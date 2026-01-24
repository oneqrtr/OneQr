import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OneQR - İşletmeler İçin Akıllı QR Menü ve Katalog Sistemi',
  description: 'Restoran, kafe, otel ve mağazalar için en hızlı dijital QR menü çözümü. Ürünlerinizi dijital ortamda sergileyin, satışlarınızı artırın.',
  keywords: 'qr menü, dijital menü, restoran qr, cafe menü, karekod menü oluşturma, ücretsiz qr menü, online katalog',
  icons: {
    icon: [
      { url: '/logoblack.png', media: '(prefers-color-scheme: light)' },
      { url: '/logowhite.png', media: '(prefers-color-scheme: dark)' },
      { url: '/logoblack.png' }, // Default fallback
    ],
    apple: [
      { url: '/logoblack.png' },
    ]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
