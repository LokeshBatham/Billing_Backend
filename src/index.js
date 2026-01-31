const path = require('path');
const dotenv = require('dotenv');
const app = require('./app');
const { init } = require('./utils/db');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const port = process.env.PORT || process.env.VITE_PORT || 5000;

(async () => {
  try {
    await init();
    console.log('[DB] init completed');
  } catch (err) {
    // If DB init fails, log a clear message and continue or exit depending on your policy
    console.error('[DB] init error', err);
    // Option: exit process to avoid running without a working DB
    // process.exit(1);
  }

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`);
  });
})();

