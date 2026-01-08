const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment-specific .env file (use .env.development or .env.production)
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = path.resolve(process.cwd(), `.env.${nodeEnv}`);
dotenv.config({ path: envFile });

// Also load a generic .env if present (allows overrides)
dotenv.config();

let _ready = false;

const isReady = () => _ready;

/**
 * Build Mongo connection URI from environment.
 * Priority:
 * 1. MONGO_URI (full mongodb connection string)
 * 2. Compose from components: MONGO_USER, MONGO_PASSWORD, MONGO_HOST, MONGO_PORT
 */
const buildMongoUri = () => {
  const explicit = process.env.VITE_MONGO_URI || process.env.VITE_MONGO_URL;
  if (explicit && explicit.trim()) return explicit.trim();

  // Require components from env if full URI not provided
  const host = process.env.VITE_MONGO_HOST;
  // const port = process.env.MONGO_PORT;
  const dbName = process.env.VITE_MONGO_DB_NAME;

  const user = process.env.VITE_MONGO_USER;
  const pass = process.env.VITE_MONGO_PASSWORD;

  // Do not fall back to any hardcoded defaults. Require env variables to be set.
  if (!host || !dbName) {
    throw new Error(`[DB] Missing Mongo configuration. Please set MONGO_URI or MONGO_HOST and MONGO_DB_NAME in ${envFile}`);
  }

  if (user && pass) {
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}${port ? `:${port}` : ''}/${dbName}`;
  }

  return `mongodb://${host}${port ? `:${port}` : ''}/${dbName}`;
};

const init = async () => {
  const uri = buildMongoUri();

  // Connection options
  const poolSize = parseInt(process.env.VITE_DB_POOL || process.env.VITE_MONGO_POOL || '5', 10) || 5;
  const connectOpts = {
    // modern mongoose uses unified topology by default; include safe defaults
    maxPoolSize: poolSize,
    // set dbName explicitly if MONGO_URI does not include it
    dbName: process.env.VITE_MONGO_DB_NAME || undefined,
  };

  try {
    // eslint-disable-next-line no-console
    console.log('[DB] connecting to MongoDB', uri ? uri.split('@').pop() : '<empty-uri>');
    await mongoose.connect(uri, connectOpts);
    _ready = true;
    // eslint-disable-next-line no-console
    console.log('[DB] connected');
    return mongoose.connection;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[DB] connection error', err);
    _ready = false;
    throw err;
  }
};

module.exports = {
  mongoose,
  init,
  isReady,
};
