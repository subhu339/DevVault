const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ---------------------------------------------------------------------------
// Helper: sign a JWT for a given user id
// ---------------------------------------------------------------------------
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ---------------------------------------------------------------------------
// Helper: build the safe user payload (never include the password hash)
// ---------------------------------------------------------------------------
const safeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  createdAt: user.createdAt,
});

// ---------------------------------------------------------------------------
// @route   POST /api/auth/register
// @desc    Create a new user account
// @access  Public
// ---------------------------------------------------------------------------
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // --- Input presence validation ---
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are all required' });
    }

    // --- Password strength ---
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // --- Duplicate check ---
    // Check both fields in one query to give a precise error message
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }

    const existingUsername = await User.findOne({ username: username.trim() });
    if (existingUsername) {
      return res.status(409).json({ message: 'That username is already taken' });
    }

    // --- Hash password ---
    // saltRounds=12 is a good balance of security and speed for 2024+ hardware
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // --- Create user ---
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    // --- Issue token ---
    const token = signToken(user._id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: safeUser(user),
    });
  } catch (error) {
    // Mongoose validation errors (schema-level rules like minlength, match)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    // Unexpected errors — pass to the global error handler in server.js
    next(error);
  }
});

// ---------------------------------------------------------------------------
// @route   POST /api/auth/login
// @desc    Authenticate user and return a JWT
// @access  Public
// ---------------------------------------------------------------------------
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // --- Input presence validation ---
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // --- Find user (include password field — excluded by default in queries) ---
    // We use +password to explicitly opt-in to the password field for this one check
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    // --- Deliberately vague error: don't reveal whether email exists ---
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // --- Compare submitted password against the stored hash ---
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // --- Issue token ---
    const token = signToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
