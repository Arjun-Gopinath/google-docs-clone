import { useState, useEffect } from 'react';
import api from '../api';
import styles from './ShareModal.module.css';

export default function ShareModal({ docId, onClose }) {
  const [email, setEmail] = useState('');
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get(`/documents/${docId}/shares`).then(({ data }) => setShares(data));
  }, [docId]);

  async function handleShare(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await api.post(`/documents/${docId}/share`, { email });
      setShares((prev) => {
        const exists = prev.find((s) => s.email === data.user.email);
        if (exists) return prev;
        return [...prev, { ...data.user, permission: data.permission }];
      });
      setSuccess(`Shared with ${data.user.name}`);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to share');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(userId) {
    await api.delete(`/documents/${docId}/shares/${userId}`);
    setShares((prev) => prev.filter((s) => s.id !== userId));
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Share document</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleShare} className={styles.form}>
          <input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.emailInput}
          />
          <button type="submit" className={styles.shareBtn} disabled={loading}>
            {loading ? '…' : 'Share'}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        {shares.length > 0 && (
          <div className={styles.shareList}>
            <p className={styles.shareListTitle}>Shared with</p>
            {shares.map((s) => (
              <div key={s.id} className={styles.shareItem}>
                <div className={styles.shareAvatar}>{s.name[0].toUpperCase()}</div>
                <div className={styles.shareInfo}>
                  <span className={styles.shareName}>{s.name}</span>
                  <span className={styles.shareEmail}>{s.email}</span>
                </div>
                <span className={styles.sharePermission}>{s.permission}</span>
                <button
                  className={styles.revokeBtn}
                  onClick={() => handleRevoke(s.id)}
                  title="Revoke access"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
