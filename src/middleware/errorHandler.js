const { ZodError } = require('zod');

function isMysqlDupError(err) {
  return err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062);
}

module.exports = (err, _req, res, _next) => {
  // Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
    return res.status(400).json({ error: 'ValidationError', details });
  }

  // MySQL duplicate entry
  if (isMysqlDupError(err)) {
    return res.status(409).json({ error: 'DuplicateEntry', message: err.sqlMessage || err.message });
  }

  // Generic DB connection errors
  if (err && (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ER_BAD_DB_ERROR')) {
    return res.status(500).json({ error: 'DatabaseError', message: err.message });
  }

  // Fallback
  console.error('[ErrorHandler] Unhandled error:', err);
  return res.status(500).json({ error: 'InternalServerError', message: err.message || 'An error occurred' });
};
