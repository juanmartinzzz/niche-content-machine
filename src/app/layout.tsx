import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SupabaseProvider } from '@/components/SupabaseProvider'
import styles from './layout.module.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '700', '900'], // Regular, Bold, Black - for brutalist typography
})

export const metadata: Metadata = {
  title: 'Niche Content Machine',
  description: 'Bold, brutal content creation platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.className} ${styles.html}`}>
      <body className={styles.body}>
        <div className={styles.container}>
          <SupabaseProvider>
            {children}
          </SupabaseProvider>
        </div>
      </body>
    </html>
  )
}
