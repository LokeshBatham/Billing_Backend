const fs = require('fs');
const path = require('path');

const ensureDirectory = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const readJsonFile = async (filePath, fallback) => {
  ensureDirectory(filePath);
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      if (fallback !== undefined) {
        await writeJsonFile(filePath, fallback);
        return fallback;
      }
      return undefined;
    }
    throw error;
  }
};

const writeJsonFile = async (filePath, data) => {
  ensureDirectory(filePath);
  const json = JSON.stringify(data, null, 2);
  await fs.promises.writeFile(filePath, `${json}\n`, 'utf8');
};

module.exports = {
  readJsonFile,
  writeJsonFile,
};

