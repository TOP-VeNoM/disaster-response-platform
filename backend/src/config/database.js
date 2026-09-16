const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connects to MongoDB Atlas. Retries a couple of times with backoff since
 * Atlas free-tier clusters can take a moment to wake up from a paused state.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.error('MONGODB_URI is not set in backend/.env — cannot start without a database.');
    process.exit(1);
  }

  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      attempt += 1;
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000
      });
      logger.info(`MongoDB connected: ${mongoose.connection.host}`);

      mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB connection error: ${err.message}`);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      return;
    } catch (err) {
      logger.error(`MongoDB connection attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
      if (attempt >= maxAttempts) {
        logger.error(
          'Could not connect to MongoDB. Check MONGODB_URI in backend/.env, ' +
          'confirm your Atlas cluster is running, and that your current IP is allow-listed ' +
          'in Atlas -> Network Access.'
        );
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, 2000 * attempt));
    }
  }
}

module.exports = connectDB;
