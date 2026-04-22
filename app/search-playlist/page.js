'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function SearchPlaylistContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')
  const router = useRouter()
  const [playlists, setPlaylists] = useState([])
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

  const savePlaylist = (playlist) => {
    try {
      const saved = localStorage.getItem('savedPlaylists')
      const playlists = saved ? JSON.parse(saved) : []

      const existingIndex = playlists.findIndex(p => p.playlistId === playlist.playlistId)
      if (existingIndex !== -1) {
        alert('Playlist already saved!')
        return
      }

      const newPlaylist = {
        playlistId: playlist.playlistId,
        title: playlist.title,
        channelTitle: playlist.channelTitle || 'Unknown Channel',
        thumbnail: playlist.thumbnail || '',
        savedAt: new Date().toISOString()
      }

      playlists.push(newPlaylist)
      localStorage.setItem('savedPlaylists', JSON.stringify(playlists))
      setSavedPlaylists(prev => new Set([...prev, playlist.playlistId]))
      alert('Playlist saved successfully!')
    } catch (error) {
      console.error('Error saving playlist:', error)
      alert('Failed to save playlist')
    }
  }

  useEffect(() => {
    if (authenticated && query) {
      fetch(`/api/search-playlist?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          setPlaylists(data.playlists || [])
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
    return <div>Loading playlist search results...</div>
  }

  return (
    <div>
      <h2>Playlist Results for &quot;{query}&quot;</h2>
      <div className="grid-container">
        {playlists.map(playlist => (
          <div key={playlist.playlistId || Math.random()} className="playlist-card">
            <img className="thumbnail" src={`/api/thumbnail/${playlist.thumbnail?.split('/')[4] || 'default'}`} alt="Playlist Thumbnail" />
            <div className="playlist-details">
              <Link href={`/playlist?id=${playlist.playlistId}`} style={{ textDecoration: 'none' }}>
                <span className="title-link">
                  {playlist.title || 'Untitled Playlist'}
                </span>
              </Link>
              <div className="meta">{playlist.channelTitle || 'Unknown Channel'} • {playlist.publishedAt || 'Unknown Date'}</div>
              <button
                onClick={() => savePlaylist(playlist)}
                disabled={savedPlaylists.has(playlist.playlistId)}
                className="save-button"
              >
                {savedPlaylists.has(playlist.playlistId) ? '✓ Saved' : '+ Save'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .grid-container {
          // display: grid;
          // grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px;
          padding: 20px;
        }
        .playlist-card {
          width: 300px;
          background-color: #1e1e1e;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.6);
          display: flex;
          flex-direction: column;
          transition: transform 0.2s;
        }
          .playlist-card:hover {
          transform: scale(1.03);
}
        .thumbnail {
          width: 100%;
          height: auto;
          object-fit: cover;
        }
        .playlist-details {
          padding: 10px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .title-link {
          color: #90caf9;
          text-decoration: none;
          display: block;
          margin-bottom: 5px;
        }
        .title-link:hover {
          text-decoration: underline;
        }
        .meta {
          color: #bbb;
          font-size: 13px;
          margin-bottom: 10px;
        }
        .save-button {
          background-color: #ff0000;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          width: 100%;
          transition: background-color 0.3s;
          margin-top: auto;
        }
        .save-button:hover:not(:disabled) {
          background-color: #cc0000;
        }
        .save-button:disabled {
          background-color: #666;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

export default function SearchPlaylist() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPlaylistContent />
    </Suspense>
  )
}
