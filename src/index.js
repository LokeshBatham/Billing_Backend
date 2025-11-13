const path = require('path');
const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const port = process.env.PORT || 5000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${port}`);
});

