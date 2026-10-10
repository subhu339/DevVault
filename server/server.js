require('dotenv').config(); // Must be first — loads .env before anything else reads process.env

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// --- Route imports ---
const authRoutes = require('./routes/auth');
const snippetRoutes = require('./routes/snippets');

// --- Connect to MongoDB ---
connectDB();

const app = express();

// --- Middleware ---

// CORS: allow requests from the local React dev server only.
// In production, replace the origin with your deployed frontend URL.
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Parse incoming JSON request bodies — 50kb limit prevents memory exhaustion from oversized payloads
app.use(express.json({ limit: '50kb' }));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

// --- Health check ---
// A lightweight endpoint to confirm the server is reachable.
// Does NOT require authentication so it can be used by load balancers / CI checks.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);

// --- 404 handler ---
// Catches any request that didn't match a route above.
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// --- Global error handler ---
// Express calls this when next(error) is called anywhere in the app.
// Keep it last, after all routes.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    // Stack trace only in development — never expose it in production
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
