const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = 3000;

// const __dirname = path.resolve();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true
}));

// Routes
const routes = require('./routes/index');
app.use('/', routes);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
