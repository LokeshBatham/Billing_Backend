const path = require('path');
const dotenv = require('dotenv');

// Load env vars BEFORE anything else
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectDB = require('./db');
const app = require('./app');

const port = process.env.VITE_PORT || process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
