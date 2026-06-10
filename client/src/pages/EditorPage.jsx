import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import EditorToolbar from '../components/EditorToolbar';
import ShareModal from '../components/ShareModal';
import styles from './EditorPage.module.css';

const AUTOSAVE_DELAY = 1000;

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [showShare, setShowShare] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const saveTimer = useRef(null);
  const titleInputRef = useRef(null);

  const saveContent = useCallback(
    async (content) => {
      try {
        setSaveStatus('saving');
        await api.put(`/documents/${id}`, { content: JSON.stringify(content) });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    },
    [id]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Start typing…' }),
    ],
    content: '',
    onUpdate({ editor }) {
      setSaveStatus('saving');
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveContent(editor.getJSON()), AUTOSAVE_DELAY);
    },
    editorProps: {
      attributes: { class: styles.proseMirror },
    },
  });

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/documents/${id}`);
        setDoc(data);
        setTitle(data.title);
        if (editor) {
          let parsed;
          try { parsed = JSON.parse(data.content); } catch { parsed = null; }
          if (parsed) editor.commands.setContent(parsed);
        }
      } catch {
        navigate('/');
      }
    }
    if (editor) load();
  }, [id, editor, navigate]);

  async function saveTitle() {
    const trimmed = title.trim() || 'Untitled Document';
    setTitle(trimmed);
    setEditingTitle(false);
    if (trimmed !== doc?.title) {
      await api.put(`/documents/${id}`, { title: trimmed });
      setDoc((prev) => ({ ...prev, title: trimmed }));
    }
  }

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.select();
  }, [editingTitle]);

  const isOwner = doc?.owner_id === user?.id;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')} title="Back to Docs">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect width="20" height="20" rx="4" fill="#4285F4" />
              <rect x="4" y="7" width="12" height="1.5" rx="0.75" fill="white" />
              <rect x="4" y="10" width="12" height="1.5" rx="0.75" fill="white" />
              <rect x="4" y="13" width="8" height="1.5" rx="0.75" fill="white" />
            </svg>
          </button>

          {editingTitle ? (
            <input
              ref={titleInputRef}
              className={styles.titleInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') { setTitle(doc.title); setEditingTitle(false); }
              }}
            />
          ) : (
            <h1
              className={styles.title}
              onClick={() => isOwner && setEditingTitle(true)}
              title={isOwner ? 'Click to rename' : undefined}
            >
              {title || 'Untitled Document'}
            </h1>
          )}

          {!isOwner && <span className={styles.sharedBadge}>Shared</span>}
        </div>

        <div className={styles.headerRight}>
          <span className={`${styles.saveStatus} ${styles[saveStatus]}`}>
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? 'Save failed' : 'Saved'}
          </span>
          {isOwner && (
            <button className={styles.shareBtn} onClick={() => setShowShare(true)}>
              Share
            </button>
          )}
        </div>
      </header>

      <EditorToolbar editor={editor} />

      <div className={styles.editorWrapper}>
        <div className={styles.page2}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {showShare && <ShareModal docId={id} onClose={() => setShowShare(false)} />}
    </div>
  );
}
