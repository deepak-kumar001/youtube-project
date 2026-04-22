'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Main() {
  const [query, setQuery] = useState('')
  const [playlistQuery, setPlaylistQuery] = useState('')
  const [videoId, setVideoId] = useState('')
  const [playlistId, setPlaylistId] = useState('')
  const [savedPlaylists, setSavedPlaylists] = useState([])
  const [authenticated, setAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    fetch('/api/auth-check')
      .then(res => {
        if (res.ok) {
          setAuthenticated(true)
          loadSavedPlaylists()
        } else {
          router.push('/login')
        }
      })
  }, [router])

  const loadSavedPlaylists = () => {
    try {
      const saved = localStorage.getItem('savedPlaylists')
      const playlists = saved ? JSON.parse(saved) : []
      setSavedPlaylists(playlists)
    } catch (error) {
      console.error('Error loading saved playlists:', error)
      setSavedPlaylists([])
    }
  }

  const deletePlaylist = (playlistId) => {
    try {
      const saved = localStorage.getItem('savedPlaylists')
      const playlists = saved ? JSON.parse(saved) : []
      const updated = playlists.filter(p => p.playlistId !== playlistId)
      localStorage.setItem('savedPlaylists', JSON.stringify(updated))
      setSavedPlaylists(updated)
    } catch (error) {
      console.error('Error deleting playlist:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  const handlePlaylistSearch = (e) => {
    e.preventDefault()
    router.push(`/search-playlist?q=${encodeURIComponent(playlistQuery)}`)
  }

  const handleVideo = (e) => {
    e.preventDefault()
    router.push(`/video?id=${videoId}`)
  }

  const handlePlaylist = (e) => {
    e.preventDefault()
    router.push(`/playlist?id=${playlistId}`)
  }

  if (!authenticated) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left Sidebar - Saved Playlists */}
      <div style={{
        width: '300px',
        backgroundColor: '#1e1e1e',
        padding: '20px',
        borderRight: '1px solid #333',
        overflowY: 'auto'
      }}>
        <h3 style={{ color: '#fff', marginBottom: '20px' }}>Saved Playlists</h3>
        {savedPlaylists.length === 0 ? (
          <p style={{ color: '#bbb' }}>No saved playlists yet</p>
        ) : (
          <div>
            {savedPlaylists.map(playlist => (
              <div key={playlist.playlistId} style={{
                backgroundColor: '#2a2a2a',
                padding: '10px',
                marginBottom: '10px',
                borderRadius: '5px',
                border: '1px solid #444',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <img
                  src={playlist.thumbnail ? `/api/thumbnail/${playlist.thumbnail.split('/')[4]}` : '/default-playlist.png'}
                  alt="Playlist thumbnail"
                  style={{height: '50px', objectFit: 'cover', borderRadius: '3px' }}
                  onError={(e) => { e.target.src = '/default-playlist.png' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link
                    href={`/playlist?id=${playlist.playlistId}`}
                    style={{
                      color: '#007bff',
                      textDecoration: 'none',
                      fontSize: '14px',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {playlist.title}
                  </Link>
                  <div style={{ color: '#666', fontSize: '12px' }}>
                    {playlist.channelTitle}
                  </div>
                </div>
                <button
                  onClick={() => deletePlaylist(playlist.playlistId)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc3545',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '5px'
                  }}
                  title="Remove playlist"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px', backgroundColor: '#121212', minHeight: '100vh' }}>
        <h1>Welcome to uTube</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
          <label htmlFor="query" style={{ display: 'block', marginBottom: '5px'}}>
            Search YouTube Videos:
          </label>
          <input
            type="text"
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              border: '1px solid #333',
              borderRadius: '4px',
              backgroundColor: '#2a2a2a',
              color: '#fff'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Search Videos
          </button>
        </form>

        <hr style={{ borderColor: '#333', margin: '20px 0' }} />

        {/* Playlist Search Form */}
        <form onSubmit={handlePlaylistSearch} style={{ marginBottom: '20px' }}>
          <label htmlFor="playlistQuery" style={{ display: 'block', marginBottom: '5px' }}>
            Search YouTube Playlists:
          </label>
          <input
            type="text"
            id="playlistQuery"
            value={playlistQuery}
            onChange={(e) => setPlaylistQuery(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              border: '1px solid #333',
              borderRadius: '4px',
              backgroundColor: '#2a2a2a',
              color: '#fff'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Search Playlists
          </button>
        </form>

        <hr style={{ borderColor: '#333', margin: '20px 0' }} />

        {/* Video ID Form */}
        <form onSubmit={handleVideo} style={{ marginBottom: '20px' }}>
          <label htmlFor="videoId" style={{ display: 'block', marginBottom: '5px'}}>
            Watch Video by ID:
          </label>
          <input
            type="text"
            id="videoId"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="Enter YouTube Video ID"
            required
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              border: '1px solid #333',
              borderRadius: '4px',
              backgroundColor: '#2a2a2a',
              color: '#fff'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Watch Video
          </button>
        </form>

        {/* Playlist ID Form */}
        <form onSubmit={handlePlaylist}>
          <label htmlFor="playlistId" style={{ display: 'block', marginBottom: '5px'}}>
            View Playlist by ID:
          </label>
          <input
            type="text"
            id="playlistId"
            value={playlistId}
            onChange={(e) => setPlaylistId(e.target.value)}
            placeholder="Enter YouTube Playlist ID"
            required
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              border: '1px solid #333',
              borderRadius: '4px',
              backgroundColor: '#2a2a2a',
              color: '#fff'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            View Playlist
          </button>
        </form>
      </div>
    </div>
  )
}