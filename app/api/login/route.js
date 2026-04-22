import jwt from 'jsonwebtoken'
import { serialize } from 'cookie'

export async function POST(request) {
  const { username, password } = await request.json()

  if (username === process.env.USERNAME && password === process.env.PASSWORD) {
    const token = jwt.sign({ username }, process.env.SECRET, { expiresIn: '1d' })

    const cookie = serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 365 * 1,
      path: '/',
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Set-Cookie': cookie,
        'Content-Type': 'application/json',
      },
    })
  } else {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}