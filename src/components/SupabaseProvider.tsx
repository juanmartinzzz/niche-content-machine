'use client'

import { createClient } from '@/lib/supabase'
import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'

interface SupabaseContextType {
  user: User | null
  loading: boolean
}

const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  loading: true,
})

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    // Initialize Supabase client
    const initSupabase = async () => {
      const client = await createClient()
      setSupabase(client)
    }
    initSupabase()
  }, [])

  useEffect(() => {
    if (!supabase) return

    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <SupabaseContext.Provider value={{ user, loading }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useUser() {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useUser must be used within a SupabaseProvider')
  }
  return context.user
}

export function useAuthLoading() {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useAuthLoading must be used within a SupabaseProvider')
  }
  return context.loading
}