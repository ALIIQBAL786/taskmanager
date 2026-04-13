import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <form onSubmit={handleSubmit} style={s.card}>
        <h1 style={s.title}>Sign In</h1>
        <p style={s.subtitle}>Task Manager</p>
        {error && <p style={s.error}>{error}</p>}
        <label style={s.label}>Email</label>
        <input
          name="email" type="email" required autoFocus
          value={form.email} onChange={handleChange} style={s.input}
          placeholder="you@example.com"
        />
        <label style={s.label}>Password</label>
        <input
          name="password" type="password" required
          value={form.password} onChange={handleChange} style={s.input}
          placeholder="••••••••"
        />
        <button type="submit" disabled={loading} style={s.btn}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <p style={s.footer}>
          No account? <Link to="/register" style={s.link}>Create one</Link>
        </p>
      </form>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' },
  card: { background: '#1e293b', padding: 40, borderRadius: 12, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,.4)' },
  title: { margin: 0, color: '#f1f5f9', fontSize: 26, fontWeight: 700 },
  subtitle: { margin: 0, color: '#64748b', fontSize: 14 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: 500 },
  input: { padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 14, outline: 'none' },
  btn: { padding: '11px 0', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginTop: 8 },
  error: { background: '#450a0a', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, fontSize: 13 },
  footer: { textAlign: 'center', color: '#64748b', fontSize: 13 },
  link: { color: '#60a5fa' },
};
