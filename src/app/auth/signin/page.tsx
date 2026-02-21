'use client'

import { useState } from 'react'
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