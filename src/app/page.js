'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin')
    if (isAdmin === 'true') {
      router.replace('/dashboard')
    } else {
      router.replace('/admin-login')
    }
  }, [])

  return null // blank screen while redirecting
}
