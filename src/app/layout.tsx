import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ISHIGAKI NIGHT',
  description: '石垣島のナイトライフガイド',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
