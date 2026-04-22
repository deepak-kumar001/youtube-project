'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth-check')
      .then(res => {
        if (res.ok) {
          return res.json()
        } else {
          return { authenticated: false }
        }
      })
      .then(data => {
        if (data.authenticated) {
          router.push('/main')
        } else {
          router.push('/login')
        }
      })
      .catch(err => {
        console.error('Auth check failed:', err)
        router.push('/login')
      })
  }, [router])

  return <div>Loading...</div>
}