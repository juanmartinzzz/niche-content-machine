'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/interaction'
import { Button } from '@/components/interaction'
import styles from './page.module.css'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
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
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      })

      if (error) {
        console.error('Sign up error:', error)
        alert(error.message)
      } else {
        console.log('Sign up successful')
        alert('Account created successfully! Please check your email and click the confirmation link to activate your account.')
        router.push('/auth/signin')
      }
    } catch (error) {
      console.error('Registration error:', error)
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
            SIGN UP
          </h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <Input
              label="FULL NAME"
              type="text"
              placeholder="ENTER YOUR FULL NAME"
              value={name}
              onChange={setName}
              required
              size="lg"
            />
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
            {isLoading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
          </Button>
        </form>

        <div className={styles.actions}>
          <p>
            ALREADY HAVE AN ACCOUNT?{' '}
            <a
              href="/auth/signin"
              className={styles.link}
            >
              SIGN IN
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}