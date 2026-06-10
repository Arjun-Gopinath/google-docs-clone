const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.txt', '.md', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error(`Unsupported file type. Allowed: ${allowed.join(', ')}`));
  },
});

function textToTiptapJson(text) {
  const paragraphs = text
    .split('\n')
    .map((line) => ({
      type: 'paragraph',
      content: line.trim() ? [{ type: 'text', text: line }] : undefined,
    }));
  return JSON.stringify({ type: 'doc', content: paragraphs });
}

function canAccess(db, docId, userId) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
  if (!doc) return null;
  if (doc.owner_id === userId) return { doc, role: 'owner' };
  const share = db
    .prepare('SELECT * FROM document_shares WHERE document_id = ? AND shared_with_user_id = ?')
    .get(docId, userId);
  if (share) return { doc, role: 'shared', permission: share.permission };
  return null;
}

function createDocumentsRouter(db) {
  const router = express.Router();

  router.use(requireAuth);

  // List owned + shared documents
  router.get('/', (req, res) => {
    const owned = db
      .prepare(
        `SELECT d.*, u.name as owner_name, u.email as owner_email
         FROM documents d JOIN users u ON d.owner_id = u.id
         WHERE d.owner_id = ?
         ORDER BY d.updated_at DESC`
      )
      .all(req.user.id);

    const shared = db
      .prepare(
        `SELECT d.*, u.name as owner_name, u.email as owner_email, ds.permission
         FROM documents d
         JOIN document_shares ds ON ds.document_id = d.id
         JOIN users u ON d.owner_id = u.id
         WHERE ds.shared_with_user_id = ?
         ORDER BY d.updated_at DESC`
      )
      .all(req.user.id);

    res.json({ owned, shared });
  });

  // Upload file → new document
  router.post('/upload', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  }, async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const title = path.basename(req.file.originalname, ext);
    let content;

    try {
      if (ext === '.docx') {
        const result = await mammoth.extractRawText({ path: req.file.path });
        content = textToTiptapJson(result.value);
      } else {
        const text = fs.readFileSync(req.file.path, 'utf-8');
        content = textToTiptapJson(text);
      }
    } catch (err) {
      return res.status(500).json({ error: 'Failed to parse file: ' + err.message });
    } finally {
      fs.unlink(req.file.path, () => {});
    }

    const result = db
      .prepare('INSERT INTO documents (title, content, owner_id) VALUES (?, ?, ?)')
      .run(title, content, req.user.id);

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(doc);
  });

  // Create document
  router.post('/', (req, res) => {
    const { title = 'Untitled Document' } = req.body;
    const result = db
      .prepare('INSERT INTO documents (title, owner_id) VALUES (?, ?)')
      .run(title, req.user.id);
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(doc);
  });

  // Get single document
  router.get('/:id', (req, res) => {
    const access = canAccess(db, parseInt(req.params.id), req.user.id);
    if (!access) return res.status(404).json({ error: 'Document not found' });

    const owner = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(access.doc.owner_id);
    res.json({ ...access.doc, owner, role: access.role });
  });

  // Update document
  router.put('/:id', (req, res) => {
    const access = canAccess(db, parseInt(req.params.id), req.user.id);
    if (!access) return res.status(404).json({ error: 'Document not found' });
    if (access.role === 'shared' && access.permission === 'view') {
      return res.status(403).json({ error: 'You only have view access to this document' });
    }

    const { title, content } = req.body;
    const updates = [];
    const values = [];

    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (content !== undefined) { updates.push('content = ?'); values.push(content); }
    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    updates.push("updated_at = datetime('now')");
    values.push(parseInt(req.params.id));

    db.prepare(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(parseInt(req.params.id));
    res.json(doc);
  });

  // Delete document (owner only)
  router.delete('/:id', (req, res) => {
    const access = canAccess(db, parseInt(req.params.id), req.user.id);
    if (!access) return res.status(404).json({ error: 'Document not found' });
    if (access.role !== 'owner') return res.status(403).json({ error: 'Only the owner can delete this document' });

    db.prepare('DELETE FROM documents WHERE id = ?').run(parseInt(req.params.id));
    res.status(204).send();
  });

  // Share document
  router.post('/:id/share', (req, res) => {
    const docId = parseInt(req.params.id);
    const access = canAccess(db, docId, req.user.id);
    if (!access) return res.status(404).json({ error: 'Document not found' });
    if (access.role !== 'owner') return res.status(403).json({ error: 'Only the owner can share this document' });

    const { email, permission = 'edit' } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const targetUser = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email);
    if (!targetUser) return res.status(404).json({ error: 'No user found with that email' });
    if (targetUser.id === req.user.id) return res.status(400).json({ error: 'You cannot share a document with yourself' });

    db.prepare(
      'INSERT OR REPLACE INTO document_shares (document_id, shared_with_user_id, permission) VALUES (?, ?, ?)'
    ).run(docId, targetUser.id, permission);

    res.status(201).json({ message: `Document shared with ${targetUser.name}`, user: targetUser, permission });
  });

  // List shares
  router.get('/:id/shares', (req, res) => {
    const docId = parseInt(req.params.id);
    const access = canAccess(db, docId, req.user.id);
    if (!access) return res.status(404).json({ error: 'Document not found' });
    if (access.role !== 'owner') return res.status(403).json({ error: 'Only the owner can view shares' });

    const shares = db
      .prepare(
        `SELECT u.id, u.name, u.email, ds.permission, ds.created_at
         FROM document_shares ds JOIN users u ON ds.shared_with_user_id = u.id
         WHERE ds.document_id = ?`
      )
      .all(docId);

    res.json(shares);
  });

  // Revoke share
  router.delete('/:id/shares/:userId', (req, res) => {
    const docId = parseInt(req.params.id);
    const access = canAccess(db, docId, req.user.id);
    if (!access) return res.status(404).json({ error: 'Document not found' });
    if (access.role !== 'owner') return res.status(403).json({ error: 'Only the owner can revoke access' });

    db.prepare(
      'DELETE FROM document_shares WHERE document_id = ? AND shared_with_user_id = ?'
    ).run(docId, parseInt(req.params.userId));

    res.status(204).send();
  });

  return router;
}

module.exports = { createDocumentsRouter };
