import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill="#4285F4" />
            <path d="M10 28V14l8-6 8 6v14H10z" fill="white" opacity="0.2" />
            <rect x="11" y="13" width="18" height="2" rx="1" fill="white" />
            <rect x="11" y="18" width="18" height="2" rx="1" fill="white" />
            <rect x="11" y="23" width="12" height="2" rx="1" fill="white" />
          </svg>
          <span>Docs</span>
        </div>
        <h1>Sign in</h1>
        <p className={styles.subtitle}>Use a test account to get started</p>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@example.com"
              required
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123"
              required
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className={styles.testAccounts}>
          <p>Test accounts (password: <code>password123</code>)</p>
          <div className={styles.accountList}>
            {['alice@example.com', 'bob@example.com', 'charlie@example.com'].map((acc) => (
              <button
                key={acc}
                type="button"
                className={styles.accountChip}
                onClick={() => setEmail(acc)}
              >
                {acc}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
