const mongoose = require('mongoose');

/**
 * Snippet schema — covers both code snippets and AI prompts.
 * Each snippet belongs to a User (owner field).
 * Tags are stored as an array of lowercase strings for easy filtering.
 */
const snippetSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Fast lookups by owner
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title must be at most 100 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    language: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'plaintext', // e.g. 'javascript', 'python', 'prompt'
    },
    tags: {
      type: [String],
      default: [],
      // Enforce lowercase tags at the application layer (routes/snippets.js)
    },
    isPublic: {
      type: Boolean,
      default: false, // Private by default
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must be at most 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Text index enables full-text search across title, content, tags, and description.
//
// WHY language_override: 'textLanguage'?
// MongoDB's text index reserves the field name "language" on each document as a
// per-document language override (e.g. "english", "french"). Our schema has a
// field *also* called "language" that stores a programming language name like
// "javascript". When MongoDB sees language:"javascript" it tries to use it as an
// ISO language identifier and throws:
//   MongoServerError: language override unsupported: javascript
//
// Setting language_override to any field name that does NOT exist on our documents
// (here "textLanguage") tells MongoDB to ignore the "language" field entirely for
// this purpose, so it is stored and queried as plain data.
snippetSchema.index(
  { title: 'text', content: 'text', tags: 'text', description: 'text' },
  { language_override: 'textLanguage' }
);

module.exports = mongoose.model('Snippet', snippetSchema);
