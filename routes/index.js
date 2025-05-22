const express = require('express');
const axios = require('axios');
const path = require('path');
const router = express.Router();
require('dotenv').config();

// Hardcoded credentials
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // Replace with your real API key
const USERNAME = "nightfury";
const PASSWORD = "asdfghjkl;'";

// Middleware to protect routes
function authMiddleware(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    } else {
        res.redirect('/login');
    }
}

// Protected main page
router.get('/', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/main.html'));
});

// Show login page
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

// Handle login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === USERNAME && password === PASSWORD) {
        req.session.authenticated = true;
        res.redirect('/main');
    } else {
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Main Page</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
            Invalid credentials. <a href="/login">Try again</a>.
        </body>
        </html>`);
    }
});

// Protected main page
router.get('/main', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/main.html'));
});

// Display single YouTube video by ID
router.get('/video', authMiddleware, (req, res) => {
    const videoId = req.query.id;
    // if (!videoId) {
    //     return res.send('No video ID provided.');
    // }
    res.sendFile(path.join(__dirname, '../views/video.html'));
});

// router.get('/playlist', authMiddleware, async (req, res) => {
//     const playlistId = req.query.id;
//     if (!playlistId) return res.send(`
//         <!DOCTYPE html>
//         <html>
//         <head>
//             <title>Main Page</title>
//             <meta name="viewport" content="width=device-width, initial-scale=1.0">
//             <link rel="stylesheet" href="/styles.css">
//         </head>
//         <body>
//             No playlist ID provided.
//         </body>
//         </html>`);

//     try {
//         const allVideos = [];
//         let nextPageToken = '';

//         do {
//             const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
//                 params: {
//                     part: 'snippet',
//                     playlistId,
//                     maxResults: 50,
//                     pageToken: nextPageToken,
//                     key: YOUTUBE_API_KEY
//                 }
//             });

//             const items = response.data.items;
//             items.forEach(item => {
//                 if (item.snippet.resourceId.kind === 'youtube#video') {
//                     allVideos.push({
//                         title: item.snippet.title,
//                         videoId: item.snippet.resourceId.videoId,
//                         thumbnail: item.snippet.thumbnails.medium.url
//                     });
//                 }
//             });

//             nextPageToken = response.data.nextPageToken;
//         } while (nextPageToken);

//         res.send(`
//             <!DOCTYPE html>
//             <html>
//             <head>
//                 <title>Playlist Viewer</title>
//                 <link rel="stylesheet" href="/styles.css">
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                 <style>
//                     .playlist-container {
//                         display: flex;
//                         flex-direction: column;
//                         gap: 20px;
//                     }
//                     .video-item {
//                         display: flex;
//                         align-items: center;
//                         gap: 20px;
//                         background-color: #1e1e1e;
//                         padding: 15px;
//                         border-radius: 8px;
//                         box-shadow: 0 0 10px rgba(0,0,0,0.5);
//                         transition: transform 0.2s;
//                     }
//                     .video-item:hover {
//                         transform: scale(1.02);
//                     }
//                     .video-thumbnail {
//                         flex-shrink: 0;
//                         width: 160px;
//                         height: 90px;
//                         border-radius: 4px;
//                     }
//                     .video-info {
//                         flex-grow: 1;
//                     }
//                     .video-title {
//                         font-size: 16px;
//                         color: #90caf9;
//                         text-decoration: none;
//                     }
//                     .video-title:hover {
//                         text-decoration: underline;
//                     }
//                 </style>
//             </head>
//             <body>
//                 <h2>Playlist Videos</h2>
//                 <div class="playlist-container">
//                     ${allVideos.map((video, index) => `
//                         <div class="video-item">
//                             <span style="color: #bbb; font-weight: bold;">${index + 1}.</span>
//                             <img class="video-thumbnail" src="${video.thumbnail}" alt="Thumbnail">
//                             <div class="video-info">
//                                 <a class="video-title" href="/video?id=${video.videoId}" target="_blank">${video.title}</a>
//                             </div>
//                         </div>
//                     `).join('')}
//                 </div>
//             </body>
//             </html>
//         `);

//     } catch (err) {
//         console.error(err.message);
//         res.send(`
//         <!DOCTYPE html>
//         <html>
//         <head>
//             <title>Main Page</title>
//             <meta name="viewport" content="width=device-width, initial-scale=1.0">
//             <link rel="stylesheet" href="/styles.css">
//         </head>
//         <body>
//             Error fetching playlist data.
//         </body>
//         </html>`);
//     }
// });

router.get('/playlist', authMiddleware, async (req, res) => {
    const playlistId = req.query.id;
    const apiKey = process.env.YOUTUBE_API_KEY;

    try {
        const videos = [];
        let nextPageToken = '';
        do {
            const response = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems`, {
                params: {
                    part: 'snippet',
                    playlistId,
                    maxResults: 50,
                    pageToken: nextPageToken,
                    key: apiKey,
                },
            });

            response.data.items.forEach(item => {
                const snippet = item.snippet;
                if (snippet && snippet.resourceId.kind === 'youtube#video') {
                    videos.push({
                        title: snippet.title,
                        videoId: snippet.resourceId.videoId,
                        thumbnail: snippet.thumbnails.medium.url,
                        channelTitle: snippet.videoOwnerChannelTitle || 'Unknown'
                    });
                }
            });

            nextPageToken = response.data.nextPageToken;
        } while (nextPageToken);

        // Send HTML with embedded JS and CSS
        res.send(generatePlaylistPage(videos));
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error fetching playlist.');
    }
});

// function generatePlaylistPage(videos) {
//     const firstVideoId = videos[0]?.videoId || '';

//     const videoItemsHtml = videos.map((video, index) => `
//         <div class="video-item ${index === 0 ? 'active' : ''}" onclick="playVideo('${video.videoId}', this)">
//             <img class="video-thumb" src="${video.thumbnail}" alt="Thumbnail">
//             <div class="video-info">
//                 <div class="video-title">${index + 1}. ${video.title}</div>
//                 <div class="video-meta">${video.channelTitle}</div>
//             </div>
//         </div>
//     `).join('');

//     return `
// <!DOCTYPE html>
// <html>
// <head>
//     <title>YouTube Playlist</title>
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <style>
//         body {
//             background-color: #121212;
//             color: #fff;
//             font-family: Arial, sans-serif;
//             margin: 0;
//             padding: 0;
//         }
//         .container {
//             display: flex;
//             flex-direction: column;
//             padding: 20px;
//         }
//         .player {
//             width: 100%;
//             max-width: 960px;
//             aspect-ratio: 16 / 9;
//             margin: 0 auto 30px auto;
//         }
//         .playlist {
//             display: flex;
//             flex-direction: column;
//             gap: 10px;
//             max-width: 960px;
//             margin: 0 auto;
//         }
//         .video-item {
//             display: flex;
//             align-items: center;
//             background-color: #1f1f1f;
//             padding: 10px;
//             border-radius: 6px;
//             cursor: pointer;
//             transition: background 0.3s;
//         }
//         .video-item:hover {
//             background-color: #333;
//         }
//         .video-item.active {
//             background-color: #3a3a3a;
//             border-left: 4px solid #1e88e5;
//         }
//         .video-thumb {
//             width: 120px;
//             height: 68px;
//             object-fit: cover;
//             margin-right: 15px;
//             border-radius: 4px;
//         }
//         .video-info {
//             flex-grow: 1;
//         }
//         .video-title {
//             font-size: 15px;
//             font-weight: bold;
//             color: #fff;
//         }
//         .video-meta {
//             font-size: 12px;
//             color: #bbb;
//         }
//     </style>
// </head>
// <body>
//     <div class="container">
//         <div class="player">
//             <iframe id="player" width="100%" height="100%" src="https://www.youtube.com/embed/${firstVideoId}" frameborder="0" allowfullscreen></iframe>
//         </div>

//         <div class="playlist">
//             ${videoItemsHtml}
//         </div>
//     </div>

//     <script>
//         function playVideo(videoId, element) {
//             const iframe = document.getElementById('player');
//             iframe.src = 'https://www.youtube.com/embed/' + videoId;

//             document.querySelectorAll('.video-item').forEach(el => el.classList.remove('active'));
//             element.classList.add('active');
//         }
//     </script>
// </body>
// </html>`;
// }

// function generatePlaylistPage(videos) {
//     const firstVideoId = videos[0]?.videoId || '';

//     const videoItemsHtml = videos.map((video, index) => `
//         <div class="video-item ${index === 0 ? 'active' : ''}" onclick="playVideo('${video.videoId}', this)">
//             <img class="video-thumb" src="${video.thumbnail}" alt="Thumbnail">
//             <div class="video-info">
//                 <div class="video-title">${index + 1}. ${video.title}</div>
//                 <div class="video-meta">${video.channelTitle}</div>
//             </div>
//         </div>
//     `).join('');

//     return `
// <!DOCTYPE html>
// <html>
// <head>
//     <title>YouTube Playlist</title>
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <style>
//         body {
//             background-color: #121212;
//             color: #fff;
//             font-family: Arial, sans-serif;
//             margin: 0;
//             padding: 0;
//         }
//         .main {
//             display: flex;
//             flex-direction: row;
//             padding: 20px;
//             gap: 20px;
//         }
//         .player-container {
//             flex: 2;
//         }
//         .playlist {
//             flex: 1;
//             max-height: 80vh;
//             overflow-y: auto;
//             display: flex;
//             flex-direction: column;
//             gap: 10px;
//         }
//         .player iframe {
//             width: 100%;
//             aspect-ratio: 16 / 9;
//             border: none;
//         }
//         .video-item {
//             display: flex;
//             align-items: center;
//             background-color: #1f1f1f;
//             padding: 8px;
//             border-radius: 6px;
//             cursor: pointer;
//             transition: background 0.3s;
//         }
//         .video-item:hover {
//             background-color: #333;
//         }
//         .video-item.active {
//             background-color: #3a3a3a;
//             border-left: 4px solid #1e88e5;
//         }
//         .video-thumb {
//             width: 100px;
//             height: 56px;
//             object-fit: cover;
//             margin-right: 10px;
//             border-radius: 4px;
//         }
//         .video-info {
//             flex-grow: 1;
//         }
//         .video-title {
//             font-size: 14px;
//             font-weight: bold;
//             color: #fff;
//         }
//         .video-meta {
//             font-size: 12px;
//             color: #bbb;
//         }

//         /* Responsive fallback */
//         @media (max-width: 768px) {
//             .main {
//                 flex-direction: column;
//             }
//             .playlist {
//                 max-height: none;
//             }
//         }
//     </style>
// </head>
// <body>
//     <div class="main">
//         <div class="player-container">
//             <div class="player">
//                 <iframe id="player" src="https://www.youtube.com/embed/${firstVideoId}" allowfullscreen></iframe>
//             </div>
//         </div>
//         <div class="playlist">
//             ${videoItemsHtml}
//         </div>
//     </div>

//     <script>
//         function playVideo(videoId, element) {
//             const iframe = document.getElementById('player');
//             iframe.src = 'https://www.youtube.com/embed/' + videoId;

//             document.querySelectorAll('.video-item').forEach(el => el.classList.remove('active'));
//             element.classList.add('active');
//         }
//     </script>
// </body>
// </html>`;
// }

function generatePlaylistPage(videos) {
    const firstVideoId = videos[0]?.videoId || '';

    const videoItemsHtml = videos.map((video, index) => `
        <div class="video-item ${index === 0 ? 'active' : ''}" onclick="playVideo('${video.videoId}', this)">
            <img class="video-thumb" src="${video.thumbnail}" alt="Thumbnail">
            <div class="video-info">
                <div class="video-title">${index + 1}. ${video.title}</div>
                <div class="video-meta">${video.channelTitle}</div>
            </div>
        </div>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Playlist</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/playlist.css">
</head>
<body>
    <div class="main">
        <div class="player-container">
            <div class="player">
                <iframe id="player" src="https://www.youtube.com/embed/${firstVideoId}" allow="autoplay; encrypted-media" allowfullscreen></iframe>
            </div>
        </div>
        <div class="playlist">
            ${videoItemsHtml}
        </div>
    </div>

    <script>
        function playVideo(videoId, element) {
            const iframe = document.getElementById('player');
            iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';

            document.querySelectorAll('.video-item').forEach(el => el.classList.remove('active'));
            element.classList.add('active');
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    </script>
</body>
</html>`;
}


router.get('/search', authMiddleware, async (req, res) => {
    const query = req.query.q;
    if (!query) return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Main Page</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
            No search query provided.
        </body>
        </html>`);

    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: 20,
                key: YOUTUBE_API_KEY
            }
        });

        const videos = response.data.items.map(item => ({
            title: item.snippet.title,
            videoId: item.id.videoId,
            channelTitle: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.medium.url,
            publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString()
        }));

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Search Results</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="/search.css">
            </head>
            <body>
                <h2>Search Results for: "${query}"</h2>
                <div class="grid-container">
                    ${videos.map(video => `
                        <div class="video-card">
                            <img class="video-thumbnail" src="${video.thumbnail}" alt="Thumbnail" />
                            <div class="video-details">
                                <a class="video-title" href="/video?id=${video.videoId}" target="_blank">${video.title}</a>
                                <div class="video-meta">${video.channelTitle} • ${video.publishedAt}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </body>
            </html>
        `);

    } catch (err) {
        console.error(err.message);
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Main Page</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
            Error fetching search results.
        </body>
        </html>`);
    }
});

router.get('/search-playlist', authMiddleware, async (req, res) => {
    const query = req.query.q;
    if (!query) return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Main Page</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
            No search query provided.
        </body>
        </html>`);

    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: query,
                type: 'playlist',
                maxResults: 12,
                key: process.env.YOUTUBE_API_KEY
            }
        });

        const playlists = response.data.items.map(item => ({
            title: item.snippet.title,
            playlistId: item.id.playlistId,
            channelTitle: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.medium.url,
            publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString()
        }));

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Search Playlist Results</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="/searchp.css">
            </head>
            <body>
                <h2>Playlist Results for "${query}"</h2>
                <div class="grid-container">
                    ${playlists.map(playlist => `
                        <div class="playlist-card">
                            <img class="thumbnail" src="${playlist.thumbnail}" alt="Playlist Thumbnail">
                            <div class="playlist-details">
                                <a class="title-link" href="/playlist?id=${playlist.playlistId}">
                                    ${playlist.title}
                                </a>
                                <div class="meta">${playlist.channelTitle} • ${playlist.publishedAt}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </body>
            </html>
        `);
    } catch (err) {
        console.error(err.message);
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Main Page</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
            Error fetching playlist search results.
        </body>
        </html>`);
    }
});

module.exports = router;
