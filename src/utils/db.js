const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

let _ready = false;

const isReady = () => _ready;

const buildMongoUri = () => {
  const explicit = "mongodb://mongo:zHJKcmEauobVHBMTpNGKSculBbJTeKFG@switchyard.proxy.rlwy.net:12354";
  if (explicit && explicit.trim()) return explicit.trim();

  const user = 'mongo';
  const pass = "zHJKcmEauobVHBMTpNGKSculBbJTeKFG";
  const host = process.env.MONGO_HOST || 'localhost';
  const port = process.env.MONGO_PORT || '27017';

  if (user && pass) {
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}`;
  }

  return `mongodb://${host}:${port}`;
};

const init = async () => {
  const uri = buildMongoUri();
  // Use new mongoose connection
  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB_NAME || 'billing_db',
    // options can be extended as needed
  });

  // ensure indexes will be created by models when required
  _ready = true;
  return mongoose.connection;
};

module.exports = {
  mongoose,
  init,
  isReady,
};
