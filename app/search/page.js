'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')
  const router = useRouter()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    if (authenticated && query) {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          setVideos(data.videos || [])
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [authenticated, query])

  if (!authenticated) {
    return <div>Loading...</div>
  }

  if (loading) {
    return <div>Loading search results...</div>
  }

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '20px' }}>
      <h2>Search Results for: &quot;{query}&quot;</h2>
      <div className="grid-container">
        {videos.map(video => (
          <div key={video.videoId || Math.random()} className="video-card">
            <img className="video-thumbnail" src={`/api/thumbnail/${video.videoId}`} alt="Thumbnail" />
            <div className="video-details">
              <Link href={`/video?id=${video.videoId}`} target="_blank" style={{ textDecoration: 'none' }}>
                <span className="video-title">
                  {video.title || 'Untitled Video'}
                </span>
              </Link>
              <div className="video-meta">{video.channelTitle || 'Unknown Channel'} • {video.publishedAt || 'Unknown Date'}</div>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          padding: 20px;
        }
        .video-card {
          background-color: #1e1e1e;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.6);
          transition: transform 0.2s;
        }
        .video-card:hover {
          transform: scale(1.02);
     }
        .video-thumbnail {
          width: 100%;
          height: auto;
          object-fit: cover;
        }
        .video-details {
          padding: 10px;
        }
        .video-title {
          font-size: 16px;
          color: #90caf9;
          text-decoration: none;
          margin-bottom: 6px;
          display: block;
        }
        .video-title:hover {
          text-decoration: underline;
        }
        .video-meta {
          color: #aaa;
          font-size: 13px;
        }
      `}</style>
    </div>
  )
}

export default function Search() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  )
}