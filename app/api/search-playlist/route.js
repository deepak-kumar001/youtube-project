import axios from 'axios'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return new Response(JSON.stringify({ error: 'No search query provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: query,
        type: 'playlist',
        maxResults: 12,
        key: process.env.YOUTUBE_API_KEY
      }
    })

    const playlists = response.data.items.map(item => ({
      title: item.snippet.title,
      playlistId: item.id.playlistId,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString()
    }))

    return new Response(JSON.stringify({ playlists }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err.message)
    return new Response(JSON.stringify({ error: 'Error fetching playlist search results' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}