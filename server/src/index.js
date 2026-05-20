// Load environment variables from .env before anything else runs
require('dotenv').config();

// Core HTTP framework and middleware
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Patches Express to forward async route errors to error handlers
require('express-async-errors');

const app = express();

// Allow the React dev server to send credentialed requests (cookies, auth headers)
app.use(
  cors({
    origin: 'http://localhost:5174',
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json());

// Parse cookies from the Cookie header
app.use(cookieParser());

// Simple liveness check for monitoring and local dev
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
  });
});

// Bind to the port defined in .env (defaults handled by your environment)
const port = process.env.PORT;

app.listen(port, () => {
  console.log('CareBridge server running on port 5000 in development mode');
});
