'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function VideoContent() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('id')
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    fetch('/api/auth-check')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/login')
        } else {
          setAuthenticated(true)
        }
      })
  }, [router])

  if (!authenticated) {
    return <div>Loading...</div>
  }

  if (!videoId) {
    return <p>No video ID provided.</p>
  }

  return (
    <div>
      <h2>Now Playing:</h2>
      <div id="videoContainer">
        <iframe
          width="900"
          height="500"
          src={`https://videoken.com/embed?videoID=${videoId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}

export default function Video() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VideoContent />
    </Suspense>
  )
}