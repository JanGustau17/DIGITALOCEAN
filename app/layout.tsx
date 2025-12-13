import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Unpack - State of Mind',
  description: 'A calm, premium experience for checking in with your feelings',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

