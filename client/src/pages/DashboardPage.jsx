import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import styles from './DashboardPage.module.css';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function DocCard({ doc, isOwned, onDelete, onRename }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  async function saveTitle() {
    const trimmed = title.trim() || 'Untitled Document';
    setTitle(trimmed);
    setEditing(false);
    if (trimmed !== doc.title) await onRename(doc.id, trimmed);
  }

  return (
    <div className={styles.card} onClick={() => !editing && navigate(`/documents/${doc.id}`)}>
      <div className={styles.cardPreview}>
        <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
          <rect width="24" height="28" rx="2" fill="#e8f0fe" />
          <rect x="4" y="6" width="16" height="2" rx="1" fill="#4285F4" opacity="0.6" />
          <rect x="4" y="10" width="16" height="1.5" rx="0.75" fill="#bdc1c6" />
          <rect x="4" y="13" width="12" height="1.5" rx="0.75" fill="#bdc1c6" />
          <rect x="4" y="16" width="14" height="1.5" rx="0.75" fill="#bdc1c6" />
        </svg>
      </div>
      <div className={styles.cardBody}>
        {editing ? (
          <input
            ref={inputRef}
            className={styles.titleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitle(doc.title); setEditing(false); } }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p className={styles.cardTitle}>{title}</p>
        )}
        <p className={styles.cardMeta}>
          {isOwned ? `Edited ${formatDate(doc.updated_at)}` : `Shared by ${doc.owner_name}`}
        </p>
      </div>
      {isOwned && (
        <div className={styles.cardMenu} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.menuBtn}
            title="Rename"
            onClick={() => setEditing(true)}
          >
            ✎
          </button>
          <button
            className={`${styles.menuBtn} ${styles.deleteBtn}`}
            title="Delete"
            onClick={() => onDelete(doc.id)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [owned, setOwned] = useState([]);
  const [shared, setShared] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  async function loadDocs() {
    try {
      const { data } = await api.get('/documents');
      setOwned(data.owned);
      setShared(data.shared);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDocs(); }, []);

  async function createDoc() {
    const { data } = await api.post('/documents');
    navigate(`/documents/${data.id}`);
  }

  async function deleteDoc(id) {
    if (!confirm('Delete this document?')) return;
    await api.delete(`/documents/${id}`);
    setOwned((prev) => prev.filter((d) => d.id !== id));
  }

  async function renameDoc(id, title) {
    await api.put(`/documents/${id}`, { title });
    setOwned((prev) => prev.map((d) => d.id === id ? { ...d, title } : d));
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const { data } = await api.post('/documents/upload', formData);
      navigate(`/documents/${data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#4285F4" />
            <rect x="8" y="10" width="16" height="2" rx="1" fill="white" />
            <rect x="8" y="15" width="16" height="2" rx="1" fill="white" />
            <rect x="8" y="20" width="10" height="2" rx="1" fill="white" />
          </svg>
          <span className={styles.appName}>Docs</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.userName}>{user?.name}</span>
          <button className={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.actions}>
          <button className={styles.newDocBtn} onClick={createDoc}>
            + New document
          </button>
          <button
            className={styles.uploadBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Upload .txt, .md, or .docx"
          >
            {uploading ? 'Uploading…' : '↑ Upload file'}
          </button>
          <span className={styles.uploadHint}>Supports .txt, .md, .docx</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.docx"
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
        </div>

        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : (
          <>
            <section>
              <h2 className={styles.sectionTitle}>My Documents</h2>
              {owned.length === 0 ? (
                <p className={styles.empty}>No documents yet. Create one above.</p>
              ) : (
                <div className={styles.grid}>
                  {owned.map((doc) => (
                    <DocCard
                      key={doc.id}
                      doc={doc}
                      isOwned
                      onDelete={deleteDoc}
                      onRename={renameDoc}
                    />
                  ))}
                </div>
              )}
            </section>

            {shared.length > 0 && (
              <section className={styles.sharedSection}>
                <h2 className={styles.sectionTitle}>Shared with me</h2>
                <div className={styles.grid}>
                  {shared.map((doc) => (
                    <DocCard key={doc.id} doc={doc} isOwned={false} onDelete={() => {}} onRename={() => {}} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
