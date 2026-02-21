'use client'

import { createClient } from '@/lib/supabase'
import { SessionContextProvider } from '@supabase/auth-helpers-react'

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  )
}