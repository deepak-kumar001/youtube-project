import https from 'https'

export async function GET(request, { params }) {
  const { id: videoId } = await params

  if (!videoId) {
    return new Response('No video ID provided', { status: 400 })
  }

  const url = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`

  return new Promise((resolve, reject) => {
    https.get(url, (ytRes) => {
      if (ytRes.statusCode !== 200) {
        resolve(new Response('Thumbnail not found', { status: ytRes.statusCode }))
        return
      }

      const contentType = ytRes.headers['content-type'] || 'image/jpeg'

      // Collect the response data
      const chunks = []
      ytRes.on('data', chunk => chunks.push(chunk))
      ytRes.on('end', () => {
        const buffer = Buffer.concat(chunks)
        resolve(new Response(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
          },
        }))
      })
    }).on('error', (err) => {
      console.error('Proxy error:', err.message)
      resolve(new Response('Error loading thumbnail', { status: 500 }))
    })
  })
}