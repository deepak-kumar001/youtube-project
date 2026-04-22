import axios from 'axios'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const playlistId = searchParams.get('id')

  if (!playlistId) {
    return new Response(JSON.stringify({ error: 'No playlist ID provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const videos = []
    let nextPageToken = ''
    const apiKey = process.env.YOUTUBE_API_KEY

    do {
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems`, {
        params: {
          part: 'snippet',
          playlistId,
          maxResults: 50,
          pageToken: nextPageToken,
          key: apiKey,
        },
      })

      response.data.items.forEach(item => {
        const snippet = item.snippet
        if (snippet && snippet.resourceId.kind === 'youtube#video') {
          videos.push({
            title: snippet.title,
            videoId: snippet.resourceId.videoId,
            thumbnail: snippet.thumbnails.medium.url,
            channelTitle: snippet.videoOwnerChannelTitle || 'Unknown'
          })
        }
      })

      nextPageToken = response.data.nextPageToken
    } while (nextPageToken)

    // Fetch playlist details
    const playlistResponse = await axios.get(`https://www.googleapis.com/youtube/v3/playlists`, {
      params: {
        part: 'snippet',
        id: playlistId,
        key: apiKey,
      },
    })

    const playlistData = playlistResponse.data.items[0]?.snippet || {}

    return new Response(JSON.stringify({ 
      videos,
      playlist: {
        title: playlistData.title,
        channelTitle: playlistData.channelTitle,
        thumbnail: playlistData.thumbnails?.medium?.url
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error.message)
    return new Response(JSON.stringify({ error: 'Error fetching playlist' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}