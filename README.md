# YouTube Project - Next.js Migration

This project has been successfully migrated from Express.js to **Next.js 16.2.4** with the App Router and **React 19**.

## ✅ Migration Status: COMPLETE

All original functionality has been preserved and enhanced with modern Next.js features. All runtime errors have been resolved and the application builds successfully.

## Features

- User authentication with JWT
- YouTube video search with dynamic grid layout
- YouTube playlist search and viewing
- **Save playlists functionality** - Save and manage favorite playlists
- **Saved playlists sidebar** - View all saved playlists on the home screen
- Individual video playback
- Responsive design with dark theme

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`:
   ```
   YOUTUBE_API_KEY=your_youtube_api_key
   USERNAME=your_username
   PASSWORD=your_password
   SECRET=your_jwt_secret
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Next.js 16.2.4** - React framework with App Router
- **React 19.2.5** - UI library
- **Turbopack** - Fast bundler (used in development)

## Migration Changes

- ✅ Converted Express routes to Next.js API routes
- ✅ Converted EJS templates to React components
- ✅ Implemented client-side authentication checks
- ✅ Moved static assets to Next.js structure
- ✅ Updated dependencies to Next.js ecosystem
- ✅ Fixed module format conflicts
- ✅ Added Suspense boundaries for useSearchParams
- ✅ Updated cookies API for Next.js 16 compatibility
- ✅ Fixed Link component imports (Next.js 16 compatibility)
- ✅ Updated dynamic API routes for params Promise handling
- ✅ Added safety checks for undefined video/playlist properties
- ✅ **Implemented save playlist functionality with local storage**
- ✅ **Added saved playlists sidebar to home screen**
- ✅ **Improved search grid layout for dynamic column fitting**

## Project Structure

```
app/
├── api/
│   ├── auth-check/
│   ├── login/
│   ├── playlist/
│   ├── search/
│   ├── search-playlist/
│   └── thumbnail/[id]/
├── login/
├── main/
├── playlist/
├── search/
├── search-playlist/
├── video/
├── globals.css
├── layout.js
└── page.js
```

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `GET /api/auth-check` - Check authentication status

### YouTube Integration
- `GET /api/search?q={query}` - Search YouTube videos
- `GET /api/search-playlist?q={query}` - Search YouTube playlists
- `GET /api/playlist?id={playlistId}` - Get playlist details
- `GET /api/thumbnail/{videoId}` - Get video thumbnail

### Playlist Management
- Saved playlist management is now handled entirely in localStorage in the browser.