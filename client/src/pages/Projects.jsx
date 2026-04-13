import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, createProject, deleteProject } from '../api/projects';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const STATUS_COLORS = { active: '#22c55e', on_hold: '#f59e0b', completed: '#3b82f6', archived: '#64748b' };

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getProjects()
      .then(({ data }) => setProjects(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createProject(form);
      setShowForm(false);
      setForm({ title: '', description: '', dueDate: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    await deleteProject(id).catch(console.error);
    setProjects((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <Layout>
      <div style={s.header}>
        <h2 style={s.title}>Projects</h2>
        <button onClick={() => setShowForm(!showForm)} style={s.btn}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={s.form}>
          <h3 style={s.formTitle}>New Project</h3>
          {error && <p style={s.error}>{error}</p>}
          <input required placeholder="Project title" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} style={s.input} />
          <textarea placeholder="Description (optional)" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...s.input, height: 80, resize: 'vertical' }} />
          <input type="date" value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={s.input} />
          <button type="submit" disabled={saving} style={s.btn}>{saving ? 'Creating...' : 'Create Project'}</button>
        </form>
      )}

      {loading ? <p>Loading...</p> : projects.length === 0 ? (
        <p style={s.empty}>No projects yet. Create your first one above.</p>
      ) : (
        <div style={s.grid}>
          {projects.map((p) => (
            <div key={p._id} style={s.card}>
              <div style={s.cardTop}>
                <span style={{ ...s.statusDot, background: STATUS_COLORS[p.status] }} />
                <span style={s.status}>{p.status.replace('_', ' ')}</span>
              </div>
              <h3 style={s.cardTitle}>{p.title}</h3>
              <p style={s.cardDesc}>{p.description || 'No description'}</p>
              <div style={s.cardMeta}>
                <span>Owner: {p.owner?.name}</span>
                {p.dueDate && <span>Due: {new Date(p.dueDate).toLocaleDateString()}</span>}
              </div>
              <div style={s.cardActions}>
                <Link to={`/projects/${p._id}`} style={s.viewBtn}>View Tasks</Link>
                {(user.role === 'admin' || p.owner?._id === user._id) && (
                  <button onClick={() => handleDelete(p._id)} style={s.deleteBtn}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { color: '#f1f5f9', margin: 0 },
  btn: { background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 },
  form: { background: '#1e293b', borderRadius: 10, padding: 24, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 },
  formTitle: { margin: 0, color: '#f1f5f9' },
  input: { padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 14 },
  error: { background: '#450a0a', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, fontSize: 13 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 },
  card: { background: '#1e293b', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 },
  cardTop: { display: 'flex', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: '50%' },
  status: { fontSize: 12, color: '#64748b', textTransform: 'capitalize' },
  cardTitle: { margin: 0, color: '#f1f5f9', fontSize: 16 },
  cardDesc: { margin: 0, color: '#64748b', fontSize: 13, lineHeight: 1.5 },
  cardMeta: { display: 'flex', gap: 16, fontSize: 12, color: '#475569' },
  cardActions: { display: 'flex', gap: 10, marginTop: 4 },
  viewBtn: { background: '#1d4ed8', color: '#fff', borderRadius: 6, padding: '6px 14px', textDecoration: 'none', fontSize: 13, fontWeight: 500 },
  deleteBtn: { background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 },
  empty: { color: '#475569', fontSize: 14 },
};
