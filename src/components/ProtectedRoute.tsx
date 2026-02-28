'use client'

import { useUser } from './SupabaseProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { createBrowserClient } from '@supabase/ssr'
import { databaseService } from '@/lib/database'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const user = useUser()
  const router = useRouter()
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    const initSupabase = async () => {
      const client = await createClient()
      setSupabase(client)
    }
    initSupabase()
  }, [])

  useEffect(() => {
    if (user === undefined || !supabase) return // Still loading

    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Check user role if required (roles can be stored in preferences JSONB field)
    if (requiredRole) {
      const checkUserRole = async () => {
        try {
          const userProfile = await databaseService.getUserProfile(user.id)
          const userRole = userProfile.preferences?.role || 'user'
          if (userRole !== requiredRole) {
            router.push('/unauthorized')
          }
        } catch (error) {
          console.error('Error checking user role:', error)
          router.push('/unauthorized')
        }
      }
      checkUserRole()
    }
  }, [user, router, requiredRole, supabase])

  if (user === undefined) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}