const express = require('express');
const axios = require('axios');
const path = require('path');
const router = express.Router();
require('dotenv').config();

// Hardcoded credentials
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // Replace with your real API key
const USERNAME = "nightfury";
const PASSWORD = "12345";

// Middleware to protect routes
function authMiddleware(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    } else {
        res.redirect('/login');
    }
}

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
        res.send('Invalid credentials. <a href="/login">Try again</a>.');
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

router.get('/playlist', authMiddleware, async (req, res) => {
    const playlistId = req.query.id;
    if (!playlistId) return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Main Page</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
            No playlist ID provided.
        </body>
        </html>`);

    try {
        const allVideos = [];
        let nextPageToken = '';

        do {
            const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
                params: {
                    part: 'snippet',
                    playlistId,
                    maxResults: 50,
                    pageToken: nextPageToken,
                    key: YOUTUBE_API_KEY
                }
            });

            const items = response.data.items;
            items.forEach(item => {
                if (item.snippet.resourceId.kind === 'youtube#video') {
                    allVideos.push({
                        title: item.snippet.title,
                        videoId: item.snippet.resourceId.videoId,
                        thumbnail: item.snippet.thumbnails.medium.url
                    });
                }
            });

            nextPageToken = response.data.nextPageToken;
        } while (nextPageToken);

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Playlist Viewer</title>
                <link rel="stylesheet" href="/styles.css">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    .playlist-container {
                        display: flex;
                        flex-direction: column;
                        gap: 20px;
                    }
                    .video-item {
                        display: flex;
                        align-items: center;
                        gap: 20px;
                        background-color: #1e1e1e;
                        padding: 15px;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.5);
                        transition: transform 0.2s;
                    }
                    .video-item:hover {
                        transform: scale(1.02);
                    }
                    .video-thumbnail {
                        flex-shrink: 0;
                        width: 160px;
                        height: 90px;
                        border-radius: 4px;
                    }
                    .video-info {
                        flex-grow: 1;
                    }
                    .video-title {
                        font-size: 16px;
                        color: #90caf9;
                        text-decoration: none;
                    }
                    .video-title:hover {
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <h2>Playlist Videos</h2>
                <div class="playlist-container">
                    ${allVideos.map((video, index) => `
                        <div class="video-item">
                            <span style="color: #bbb; font-weight: bold;">${index + 1}.</span>
                            <img class="video-thumbnail" src="${video.thumbnail}" alt="Thumbnail">
                            <div class="video-info">
                                <a class="video-title" href="/video?id=${video.videoId}" target="_blank">${video.title}</a>
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
            Error fetching playlist data.
        </body>
        </html>`);
    }
});

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
                <style>
                    body {
                        margin: 0;
                        font-family: Arial, sans-serif;
                        background-color: #121212;
                        color: #fff;
                    }

                    h2 {
                        margin: 20px;
                        color: #fff;
                    }

                    .grid-container {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        gap: 20px;
                        padding: 20px;
                    }

                    .video-card {
                        background-color: #1e1e1e;
                        border-radius: 8px;
                        overflow: hidden;
                        width: 300px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
                        transition: transform 0.2s;
                    }

                    .video-card:hover {
                        transform: scale(1.02);
                    }

                    .video-thumbnail {
                        width: 100%;
                        height: auto;
                        display: block;
                    }

                    .video-details {
                        padding: 10px;
                    }

                    .video-title {
                        font-size: 16px;
                        color: #90caf9;
                        text-decoration: none;
                        margin-bottom: 6px;
                        display: block;
                    }

                    .video-title:hover {
                        text-decoration: underline;
                    }

                    .video-meta {
                        font-size: 13px;
                        color: #aaa;
                    }
                </style>
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






// TODO: Add /video, /playlist, /search routes later

module.exports = router;
