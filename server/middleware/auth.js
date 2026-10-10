const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protects routes that require authentication.
 * Reads a Bearer token from the Authorization header, verifies it,
 * and attaches the resolved user (without the password) to req.user.
 *
 * Usage: router.get('/protected', protect, handler)
 *
 * NOTE: Auth routes (register/login) are not implemented yet.
 *       This middleware is scaffolded so routes/snippets.js can import it
 *       when CRUD is added in the next phase.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the user to the request, excluding the hashed password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      return next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ message: 'Not authorised, invalid token' });
    }
  }

  // No Authorization header or does not start with "Bearer "
  return res.status(401).json({ message: 'Not authorised, no token provided' });
};

module.exports = { protect };
