import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../api/projects';
import { getMyTasks } from '../api/users';
import Layout from '../components/Layout';

const statusColor = { todo: '#64748b', in_progress: '#3b82f6', in_review: '#f59e0b', done: '#22c55e' };
const priorityColor = { low: '#64748b', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProjects(), getMyTasks()])
      .then(([p, t]) => { setProjects(p.data); setTasks(t.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><p>Loading...</p></Layout>;

  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const openTasks = tasks.filter((t) => t.status !== 'done').length;

  return (
    <Layout>
      <h2 style={s.greeting}>Welcome back, {user.name}</h2>
      <div style={s.statsRow}>
        <StatCard label="Total Projects" value={projects.length} color="#3b82f6" />
        <StatCard label="Active Projects" value={activeProjects} color="#22c55e" />
        <StatCard label="My Open Tasks" value={openTasks} color="#f59e0b" />
        <StatCard label="Role" value={user.role.toUpperCase()} color={user.role === 'admin' ? '#a855f7' : '#64748b'} />
      </div>

      <h3 style={s.sectionTitle}>Recent Projects</h3>
      {projects.length === 0 ? (
        <p style={s.empty}>No projects yet. <Link to="/projects" style={s.link}>Create one</Link></p>
      ) : (
        <div style={s.grid}>
          {projects.slice(0, 6).map((p) => (
            <Link to={`/projects/${p._id}`} key={p._id} style={s.card}>
              <div style={s.cardHeader}>
                <span style={s.cardTitle}>{p.title}</span>
                <span style={{ ...s.badge, background: '#1e3a5f' }}>{p.status}</span>
              </div>
              <p style={s.cardDesc}>{p.description || 'No description'}</p>
              <span style={s.cardOwner}>Owner: {p.owner?.name}</span>
            </Link>
          ))}
        </div>
      )}

      <h3 style={s.sectionTitle}>My Tasks</h3>
      {tasks.length === 0 ? (
        <p style={s.empty}>No tasks assigned to you.</p>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              {['Task', 'Project', 'Status', 'Priority', 'Due'].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.slice(0, 10).map((t) => (
              <tr key={t._id} style={s.tr}>
                <td style={s.td}>{t.title}</td>
                <td style={s.td}>{t.project?.title}</td>
                <td style={s.td}><span style={{ ...s.badge, background: statusColor[t.status] + '33', color: statusColor[t.status] }}>{t.status}</span></td>
                <td style={s.td}><span style={{ ...s.badge, background: priorityColor[t.priority] + '33', color: priorityColor[t.priority] }}>{t.priority}</span></td>
                <td style={s.td}>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...s.statCard, borderTop: `3px solid ${color}` }}>
      <span style={{ ...s.statValue, color }}>{value}</span>
      <span style={s.statLabel}>{label}</span>
    </div>
  );
}

const s = {
  greeting: { color: '#f1f5f9', marginBottom: 24, fontWeight: 600 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 40 },
  statCard: { background: '#1e293b', borderRadius: 10, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6 },
  statValue: { fontSize: 28, fontWeight: 700 },
  statLabel: { color: '#64748b', fontSize: 13 },
  sectionTitle: { color: '#94a3b8', fontSize: 16, fontWeight: 600, marginBottom: 16, borderBottom: '1px solid #1e293b', paddingBottom: 8 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 40 },
  card: { background: '#1e293b', borderRadius: 10, padding: 20, textDecoration: 'none', display: 'block', transition: 'background .2s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: '#f1f5f9', fontWeight: 600, fontSize: 15 },
  cardDesc: { color: '#64748b', fontSize: 13, margin: '0 0 12px' },
  cardOwner: { color: '#475569', fontSize: 12 },
  badge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: '#64748b', fontSize: 12, fontWeight: 600, padding: '8px 12px', borderBottom: '1px solid #1e293b', textTransform: 'uppercase' },
  td: { padding: '12px', borderBottom: '1px solid #1e293b', fontSize: 13, color: '#cbd5e1' },
  tr: { transition: 'background .15s' },
  empty: { color: '#475569', fontSize: 14 },
  link: { color: '#60a5fa' },
};
