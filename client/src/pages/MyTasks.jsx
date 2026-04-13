import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyTasks } from '../api/users';
import Layout from '../components/Layout';

const STATUS_COLORS = { todo: '#64748b', in_progress: '#3b82f6', in_review: '#f59e0b', done: '#22c55e' };
const PRIORITY_COLORS = { low: '#64748b', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getMyTasks()
      .then(({ data }) => setTasks(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <Layout>
      <h2 style={s.title}>My Tasks</h2>
      <div style={s.filters}>
        {['all', 'todo', 'in_progress', 'in_review', 'done'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>
      {loading ? <p>Loading...</p> : filtered.length === 0 ? (
        <p style={s.empty}>No tasks found.</p>
      ) : (
        <div style={s.list}>
          {filtered.map((t) => (
            <div key={t._id} style={s.card}>
              <div style={s.cardLeft}>
                <span style={{ ...s.dot, background: STATUS_COLORS[t.status] }} />
                <div>
                  <p style={s.taskTitle}>{t.title}</p>
                  <p style={s.meta}>
                    <Link to={`/projects/${t.project?._id}`} style={s.projectLink}>
                      {t.project?.title}
                    </Link>
                    {t.dueDate && ` · Due ${new Date(t.dueDate).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <span style={{ ...s.badge, background: PRIORITY_COLORS[t.priority] + '22', color: PRIORITY_COLORS[t.priority] }}>
                {t.priority}
              </span>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

const s = {
  title: { color: '#f1f5f9', marginBottom: 20 },
  filters: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  filterBtn: { background: '#1e293b', color: '#64748b', border: '1px solid #334155', borderRadius: 99, padding: '5px 14px', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' },
  filterActive: { background: '#1d4ed8', color: '#fff', borderColor: '#1d4ed8' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: { background: '#1e293b', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  dot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  taskTitle: { margin: 0, color: '#e2e8f0', fontSize: 14, fontWeight: 500 },
  meta: { margin: '4px 0 0', fontSize: 12, color: '#475569' },
  projectLink: { color: '#60a5fa', textDecoration: 'none' },
  badge: { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, textTransform: 'uppercase' },
  empty: { color: '#475569', fontSize: 14 },
};
