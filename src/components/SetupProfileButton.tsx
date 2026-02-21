'use client'

import { Button } from '@/components/interaction'

export function SetupProfileButton() {
  const handleClick = () => {
    window.location.href = '/profile/setup'
  }

  return (
    <Button
      variant="primary"
      size="lg"
      onClick={handleClick}
    >
      Set up Profile
    </Button>
  )
}