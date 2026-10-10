const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI from environment variables.
 * Exits the process on failure so the server never starts in a broken state.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Drop the stale text index on the snippets collection if it exists.
    // This is needed once because the original index was created without
    // language_override, and MongoDB will refuse to create the corrected index
    // alongside the old one. After the first successful restart this becomes
    // a no-op (dropIndex on a non-existent index is silently ignored).
    try {
      await conn.connection.db.collection('snippets').dropIndex('title_text_content_text_tags_text_description_text');
      console.log('Dropped stale snippets text index — will be recreated with correct options');
    } catch (indexErr) {
      // Index doesn't exist (already dropped or never created) — safe to ignore
      if (indexErr.codeName !== 'IndexNotFound') {
        console.warn('Could not drop stale index:', indexErr.message);
      }
    }
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
