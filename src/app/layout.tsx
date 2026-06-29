import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'U4V — Unidos por Venezuela | Sistema de Logística de Emergencia',
  description:
    'Plataforma de coordinación logística post-rescate. Coordina la oferta y demanda de ayuda humanitaria en tiempo real, evitando la sobresaturación de zonas afectadas.',
  keywords: ['logística', 'emergencia', 'Venezuela', 'ayuda humanitaria', 'coordinación'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} font-sans`}>
        {children}
      </body>
    </html>
  )
}
