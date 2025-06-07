import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SkyScope - Weather Intelligence',
  description: 'Advanced Weather Forecasting',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
