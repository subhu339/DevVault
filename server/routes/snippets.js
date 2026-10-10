const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Snippet = require('../models/Snippet');
const { protect } = require('../middleware/auth');

// ---------------------------------------------------------------------------
// Helper: check if a string is a valid MongoDB ObjectId
// Avoids a CastError from Mongoose when the caller passes a garbage id.
// ---------------------------------------------------------------------------
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ---------------------------------------------------------------------------
// All routes below require a valid JWT.
// req.user is populated by the protect middleware from the verified token.
// Ownership is always derived from req.user._id — never from the request body.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// @route   GET /api/snippets
// @desc    Get all snippets belonging to the logged-in user
// @access  Protected
// ---------------------------------------------------------------------------
router.get('/', protect, async (req, res, next) => {
  try {
    const snippets = await Snippet.find({ owner: req.user._id })
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      count: snippets.length,
      snippets,
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// @route   POST /api/snippets
// @desc    Create a new snippet for the logged-in user
// @access  Protected
// ---------------------------------------------------------------------------
router.post('/', protect, async (req, res, next) => {
  try {
    const { title, content, language, tags, description, isPublic } = req.body;

    // --- Required field validation ---
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // --- Normalise tags: ensure array of lowercase trimmed strings ---
    const normalisedTags = Array.isArray(tags)
      ? tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean)
      : [];

    const snippet = await Snippet.create({
      owner: req.user._id,   // Always from the verified token, never the body
      title: title.trim(),
      content,
      language: language ? String(language).toLowerCase().trim() : 'plaintext',
      tags: normalisedTags,
      description: description ? String(description).trim() : '',
      isPublic: typeof isPublic === 'boolean' ? isPublic : false,
    });

    res.status(201).json({ message: 'Snippet created', snippet });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    next(error);
  }
});

// ---------------------------------------------------------------------------
// @route   GET /api/snippets/:id
// @desc    Get one snippet — only if it belongs to the logged-in user
// @access  Protected
// ---------------------------------------------------------------------------
router.get('/:id', protect, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid snippet ID' });
    }

    const snippet = await Snippet.findOne({
      _id: req.params.id,
      owner: req.user._id,  // Ownership check — prevents reading other users' snippets
    });

    if (!snippet) {
      // Return 404 whether the snippet doesn't exist OR belongs to someone else.
      // This avoids leaking whether a given ID exists in the database.
      return res.status(404).json({ message: 'Snippet not found' });
    }

    res.status(200).json({ snippet });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// @route   PUT /api/snippets/:id
// @desc    Update a snippet — only if it belongs to the logged-in user
// @access  Protected
// ---------------------------------------------------------------------------
router.put('/:id', protect, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid snippet ID' });
    }

    const { title, content, language, tags, description, isPublic } = req.body;

    // --- Build only the fields that were actually sent ---
    // This allows partial updates without wiping fields the client didn't include.
    const updates = {};
    if (title !== undefined)       updates.title       = String(title).trim();
    if (content !== undefined)     updates.content     = content;
    if (language !== undefined)    updates.language    = String(language).toLowerCase().trim();
    if (description !== undefined) updates.description = String(description).trim();
    if (isPublic !== undefined)    updates.isPublic    = Boolean(isPublic);
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags)
        ? tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean)
        : [];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    const snippet = await Snippet.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id }, // Ownership enforced in the query
      { $set: updates },
      { new: true, runValidators: true }            // Return updated doc; run schema validators
    );

    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    res.status(200).json({ message: 'Snippet updated', snippet });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    next(error);
  }
});

// ---------------------------------------------------------------------------
// @route   DELETE /api/snippets/:id
// @desc    Delete a snippet — only if it belongs to the logged-in user
// @access  Protected
// ---------------------------------------------------------------------------
router.delete('/:id', protect, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid snippet ID' });
    }

    const snippet = await Snippet.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,  // Ownership enforced — can't delete another user's snippet
    });

    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    res.status(200).json({ message: 'Snippet deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
