'use client'

import { Button } from '@/components/interaction'

export function EditProfileButton() {
  const handleClick = () => {
    window.location.href = '/profile/edit'
  }

  return (
    <Button
      variant="secondary"
      size="lg"
      onClick={handleClick}
    >
      Edit Profile
    </Button>
  )
}