/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    USERNAME: process.env.USERNAME,
    PASSWORD: process.env.PASSWORD,
    SECRET: process.env.SECRET,
  },
}

module.exports = nextConfig