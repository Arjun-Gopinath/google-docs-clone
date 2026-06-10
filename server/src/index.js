require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db/database');
const { createAuthRouter } = require('./routes/auth');
const { createDocumentsRouter } = require('./routes/documents');

function createApp(db) {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json({ limit: '10mb' }));

  app.use('/api/auth', createAuthRouter(db));
  app.use('/api/documents', createDocumentsRouter(db));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // Serve React build in production
  if (process.env.NODE_ENV === 'production') {
    const clientDist = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientDist));
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return app;
}

// Start server when this file is the entry point (not when required by tests)
const isMain = process.argv[1] && require('path').resolve(process.argv[1]) === require('path').resolve(__filename);
if (isMain) {
  const db = getDb();

  // Auto-seed in development if no users exist
  if (process.env.NODE_ENV !== 'production') {
    const count = db.prepare('SELECT COUNT(*) as c FROM users').get();
    if (count.c === 0) {
      require('./db/seed');
    }
  }

  const app = createApp(db);
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = { createApp };
