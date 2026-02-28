'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/interaction'
import { Button } from '@/components/interaction'
import styles from './page.module.css'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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
    if (!supabase) return

    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        console.log('Auth check result:', { user: !!user, error })
        if (user) {
          console.log('User is already authenticated, redirecting to home')
          router.push('/')
        }
      } catch (error) {
        console.error('Error checking auth status:', error)
      }
    }
    checkAuth()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit called')
    e.preventDefault()
    console.log('Form submitted with:', { email, password: '***' })
    setIsLoading(true)

    try {
      console.log('Calling supabase.auth.signInWithPassword...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Sign in response:', { user: !!data?.user, error })

      if (error) {
        console.error('Sign in error:', error)

        // Handle specific error cases
        if (error.message.includes('Email not confirmed')) {
          alert('Please check your email and click the confirmation link before signing in.')
        } else if (error.message.includes('Invalid login credentials')) {
          alert('Invalid email or password. Please check your credentials and try again.')
        } else {
          alert(error.message)
        }
      } else {
        console.log('Sign in successful, redirecting to home')
        router.push('/')
      }
    } catch (error) {
      console.error('Sign in error (catch):', error)
      alert('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            SIGN IN
          </h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <Input
              label="EMAIL"
              type="email"
              placeholder="ENTER YOUR EMAIL"
              value={email}
              onChange={setEmail}
              required
              size="lg"
            />
            <Input
              label="PASSWORD"
              type="password"
              placeholder="ENTER YOUR PASSWORD"
              value={password}
              onChange={setPassword}
              required
              size="lg"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
          </Button>
        </form>

        <div className={styles.actions}>
          <p>
            DON'T HAVE AN ACCOUNT?{' '}
            <a
              href="/auth/signup"
              className={styles.link}
            >
              SIGN UP
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}