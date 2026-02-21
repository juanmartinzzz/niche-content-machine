import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SupabaseProvider } from '@/components/SupabaseProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'My Next.js App',
  description: 'Next.js app with Supabase authentication',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}
