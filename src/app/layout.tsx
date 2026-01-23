import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OneQR - Restoranlar İçin Akıllı QR Menü Sistemi',
  description: 'Restoran ve kafeler için en hızlı, modern ve uygun fiyatlı QR menü çözümü.',
  icons: {
    icon: [
      { url: '/logo-standard.png', media: '(prefers-color-scheme: light)' },
      { url: '/logo-negative.png', media: '(prefers-color-scheme: dark)' },
    ]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
