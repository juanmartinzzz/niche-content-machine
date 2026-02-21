'use client'

import { useUser } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { databaseService } from '@/lib/database'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const user = useUser()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (user === undefined) return // Still loading

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
  }, [user, router, requiredRole])

  if (user === undefined) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}