const path = require('path');
const dotenv = require('dotenv');
const app = require('../src/app');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Export the Express app as a serverless function for Vercel
module.exports = app;

