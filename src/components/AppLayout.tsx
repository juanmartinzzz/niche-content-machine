'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { AppBar } from './AppBar'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (user && !error) {
          setUserEmail(user.email || null)
        } else {
          setUserEmail(null)
        }
      } catch (error) {
        console.error('Error getting user:', error)
        setUserEmail(null)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserEmail(session?.user?.email || null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Don't show AppBar while loading or if no user
  const showAppBar = !isLoading && userEmail

  return (
    <>
      {showAppBar && <AppBar userEmail={userEmail} />}
      {children}
    </>
  )
}