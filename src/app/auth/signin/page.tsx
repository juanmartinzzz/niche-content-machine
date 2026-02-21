'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        alert(error.message)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      alert('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignInWithProvider = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        alert(error.message)
      }
    } catch (error) {
      console.error('OAuth sign in error:', error)
      alert('An unexpected error occurred')
    }
  }

  return (
    <div>
      <div>
        <div>
          <h2>
            Sign in to your account
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div>
            <div>
              <div>
                <div></div>
              </div>
              <div>
                <span>Or continue with</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => handleSignInWithProvider('google')}
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSignInWithProvider('github')}
              >
                GitHub
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}