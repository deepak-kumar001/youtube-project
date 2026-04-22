'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function PlaylistContent() {
  const searchParams = useSearchParams()
  const playlistId = searchParams.get('id')
  const router = useRouter()
  const [videos, setVideos] = useState([])
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [savedPlaylists, setSavedPlaylists] = useState(new Set())

  useEffect(() => {
    fetch('/api/auth-check')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated) {
          router.push('/login')
        } else {
          setAuthenticated(true)
          loadSavedPlaylists()
        }
      })
  }, [router])

  const loadSavedPlaylists = () => {
    try {
      const saved = localStorage.getItem('savedPlaylists')
      const playlists = saved ? JSON.parse(saved) : []
      const savedIds = new Set(playlists.map(p => p.playlistId))
      setSavedPlaylists(savedIds)
    } catch (error) {
      console.error('Error loading saved playlists:', error)
      setSavedPlaylists(new Set())
    }
  }

  useEffect(() => {
    if (authenticated && playlistId) {
      fetch(`/api/playlist?id=${playlistId}`)
        .then(res => res.json())
        .then(data => {
          setVideos(data.videos || [])
          setPlaylist(data.playlist || null)
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [authenticated, playlistId])

  const playVideo = (videoId, element) => {
    const iframe = document.getElementById('player')
    iframe.src = `https://videoken.com/embed?videoID=${videoId}?autoplay=1`

    document.querySelectorAll('.video-item').forEach(el => el.classList.remove('active'))
    element.classList.add('active')
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const savePlaylist = () => {
    if (!playlist) {
      alert('Playlist data not available')
      return
    }

    try {
      const saved = localStorage.getItem('savedPlaylists')
      const playlists = saved ? JSON.parse(saved) : []

      // Check if playlist already exists
      const existingIndex = playlists.findIndex(p => p.playlistId === playlistId)
      if (existingIndex !== -1) {
        alert('Playlist already saved!')
        return
      }

      // Add new playlist
      const newPlaylist = {
        playlistId,
        title: playlist.title,
        channelTitle: playlist.channelTitle || 'Unknown Channel',
        thumbnail: playlist.thumbnail || '',
        savedAt: new Date().toISOString()
      }

      playlists.push(newPlaylist)
      localStorage.setItem('savedPlaylists', JSON.stringify(playlists))
      setSavedPlaylists(prev => new Set([...prev, playlistId]))
      alert('Playlist saved successfully!')
    } catch (error) {
      console.error('Error saving playlist:', error)
      alert('Failed to save playlist')
    }
  }

  useEffect(() => {
    if (videos.length > 0) {
      const lazyImages = document.querySelectorAll('img.lazy')

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target
            img.src = img.dataset.src
            img.classList.remove('lazy')
            observer.unobserve(img)
          }
        })
      })

      lazyImages.forEach(img => observer.observe(img))
    }
  }, [videos])

  if (!authenticated) {
    return <div>Loading...</div>
  }

  if (loading) {
    return <div>Loading playlist...</div>
  }

  const firstVideoId = videos[0]?.videoId || ''

  return (
    <div className='out'>
      <button onClick={savePlaylist} disabled={savedPlaylists.has(playlistId)}>
        {savedPlaylists.has(playlistId) ? '✓ Saved' : '💾 Save Playlist'}
      </button>
      <div className="main">
        <div className="player-container">
          <div className="player">
            <iframe id="player" src={`https://videoken.com/embed?videoID=${firstVideoId}`} allow="autoplay; encrypted-media" allowFullScreen />
          </div>
        </div>
        <div className="playlist">
          {videos.map((video, index) => (
            <div
              key={video.videoId}
              className={`video-item ${index === 0 ? 'active' : ''}`}
              onClick={(e) => playVideo(video.videoId, e.currentTarget)}
            >
              <img className="video-thumb lazy" data-src={`/api/thumbnail/${video.videoId}`} alt="Thumbnail" width="320" height="180" />
              <div className="video-info">
                <div className="video-title">{index + 1}. {video.title}</div>
                <div className="video-meta">{video.channelTitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .out{
        margin: 20px;}
        .main {
          display: flex;
          flex-direction: row;
          padding: 20px;
          gap: 20px;
          margin: 10px 10px;
        }
        .player-container {
            flex: 2;
        }

        .playlist {
            flex: 1;
            max-height: 80vh;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
            scrollbar-width: thin;
            scrollbar-color: #555 #1f1f1f;
        }

        .player iframe {
            width: 100%;
            aspect-ratio: 16 / 9;
            border-radius: 8px;
            border: none;
        }

        .video-item {
            display: flex;
            align-items: center;
            background-color: #1f1f1f;
            padding: 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.3s;
        }

        .video-item:hover {
            background-color: #333;
        }

        .video-item.active {
            background-color: #3a3a3a;
            border-left: 4px solid #1e88e5;
        }

        .video-thumb {
            width: 100px;
            height: 56px;
            object-fit: cover;
            margin-right: 10px;
            border-radius: 4px;
        }

        .video-info {
            flex-grow: 1;
        }

        .video-title {
            font-size: 14px;
            font-weight: bold;
            color: #fff;
        }

        .video-meta {
            font-size: 12px;
            color: #bbb;
        }

        /* Dark scrollbars - Chrome, Edge, Safari */
        .playlist::-webkit-scrollbar {
            width: 8px;
        }

        .playlist::-webkit-scrollbar-thumb {
            background-color: #555;
            border-radius: 4px;
        }

        .playlist::-webkit-scrollbar-track {
            background-color: #1f1f1f;
        }
        /* Responsive fallback */
        @media (max-width: 768px) {
            .main {
                flex-direction: column;
            }

            .playlist {
                max-height: none;
            }
        }
        button {
          // background-color: #ff0000;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          // margin-bottom: 20px;
          transition: background-color 0.3s;
        }
        button:hover:not(:disabled) {
          background-color: #0d47a1;
        }
        button:disabled {
          background-color: #666;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

export default function Playlist() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlaylistContent />
    </Suspense>
  )
}