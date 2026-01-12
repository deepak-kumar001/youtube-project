const express = require('express');
const axios = require('axios');
const https = require("https");
const path = require('path');
const router = express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Hardcoded credentials
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // Replace with your real API key
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

// Middleware to protect routes
function authMiddleware(req, res, next) {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        req.user = decoded; // Optional: access user info
        next();
    } catch (err) {
        return res.redirect('/login');
    }
    // return next();
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
        const token = jwt.sign({ username }, process.env.SECRET, { expiresIn: '1d' });

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: true,          // false in development (localhost)
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 365 * 1
            // DO NOT set `expires` or `maxAge` → makes it a session cookie
        });
        res.redirect('/main');
    } else {
        return res.render('error', { msg: 'Invalid credentials.', path: "/login" });
    }
});

// Protected main page
router.get('/main', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/main.html'));
});

// Proxy route for YouTube thumbnails
router.get("/thumbnail/:id", (req, res) => {
    const videoId = req.params.id;
    const url = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

    https.get(url, (ytRes) => {
        if (ytRes.statusCode !== 200) {
            return res.status(ytRes.statusCode).send("Thumbnail not found");
        }

        res.setHeader("Content-Type", ytRes.headers["content-type"] || "image/jpeg");
        ytRes.pipe(res);
    }).on("error", (err) => {
        console.error("Proxy error:", err.message);
        res.status(500).send("Error loading thumbnail");
    });
});

// Display single YouTube video by ID
router.get('/video', authMiddleware, (req, res) => {
    const videoId = req.query.id;
    // if (!videoId) {
    //     return res.send('No video ID provided.');
    // }
    res.sendFile(path.join(__dirname, '../views/video.html'));
});

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
        // res.render('playlist', { videos });
        res.send(generatePlaylistPage(videos));
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error fetching playlist.');
    }
});

function generatePlaylistPage(videos) {
    const firstVideoId = videos[0]?.videoId || '';
    // <div class="video-item ${index === 0 ? 'active' : ''}" onclick="playVideo('${video.videoId}', this)">
    const videoItemsHtml = videos.map((video, index) => `
        <div class="video-item ${index === 0 ? 'active' : ''}" onclick="playVideo('${video.videoId}', this)">
            <img class="video-thumb lazy" data-src="/thumbnail/${video.videoId}" alt="Thumbnail"  width="320" height="180" />
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
                <iframe id="player" src="https://videoken.com/embed?videoID=${firstVideoId}" allow="autoplay; encrypted-media" allowfullscreen></iframe>
            </div>
        </div>
        <div class="playlist">
            ${videoItemsHtml}
        </div>
    </div>

    <script>

        document.addEventListener("DOMContentLoaded", () => {
            const lazyImages = document.querySelectorAll("img.lazy");

            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove("lazy");
                        observer.unobserve(img);
                    }
                });
            });

            lazyImages.forEach(img => observer.observe(img));
        });

        function playVideo(videoId, element) {
            const iframe = document.getElementById('player');
            iframe.src = 'https://videoken.com/embed?videoID=' + videoId + '?autoplay=1';

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
    if (!query) return res.render('error', { msg: "No search query provided.", path: null })

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
                            <img class="video-thumbnail" src="/thumbnail/${video.videoId}" alt="Thumbnail" />
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
        return res.render('error', { msg: "Error fetching search results.", path: null })
    }
});

router.get('/search-playlist', authMiddleware, async (req, res) => {
    const query = req.query.q;
    if (!query) return res.render('error', { msg: "No search query provided.", path: null })

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
                            <img class="thumbnail" src="/thumbnail/${playlist.thumbnail.split("/")[4]}" alt="Playlist Thumbnail">
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
        return res.render('error', { msg: "Error fetching playlist search results.", path: null })
    }
});

module.exports = router;
