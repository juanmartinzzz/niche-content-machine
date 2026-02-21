'use client'

import { Button } from '@/components/interaction'

export function DashboardButton() {
  const handleClick = () => {
    window.location.href = '/dashboard'
  }

  return (
    <Button
      variant="primary"
      size="lg"
      onClick={handleClick}
    >
      Go to Dashboard
    </Button>
  )
}