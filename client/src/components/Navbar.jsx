import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <Link to="/dashboard" style={styles.brand}>TaskManager</Link>
      <div style={styles.links}>
        <Link to="/dashboard" style={styles.link}>Dashboard</Link>
        <Link to="/projects" style={styles.link}>Projects</Link>
        <Link to="/my-tasks" style={styles.link}>My Tasks</Link>
        {user?.role === 'admin' && (
          <Link to="/admin" style={{ ...styles.link, color: '#f59e0b' }}>Admin</Link>
        )}
      </div>
      <div style={styles.user}>
        <span style={styles.userInfo}>{user?.name} <em style={styles.role}>({user?.role})</em></span>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px', height: 56, background: '#1e293b', color: '#f1f5f9',
    position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,.3)',
  },
  brand: { color: '#60a5fa', fontWeight: 700, fontSize: 18, textDecoration: 'none' },
  links: { display: 'flex', gap: 20 },
  link: { color: '#cbd5e1', textDecoration: 'none', fontSize: 14, fontWeight: 500 },
  user: { display: 'flex', alignItems: 'center', gap: 12 },
  userInfo: { fontSize: 13, color: '#94a3b8' },
  role: { fontStyle: 'italic', color: '#64748b' },
  logoutBtn: {
    background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6,
    padding: '5px 12px', cursor: 'pointer', fontSize: 13,
  },
};
