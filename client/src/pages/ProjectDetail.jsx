import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProject, getTasks, createTask, updateTask, deleteTask } from '../api/projects';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const STATUSES = ['todo', 'in_progress', 'in_review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUS_COLORS = { todo: '#64748b', in_progress: '#3b82f6', in_review: '#f59e0b', done: '#22c55e' };
const PRIORITY_COLORS = { low: '#64748b', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '' });
  const [saving, setSaving] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const loadData = async () => {
    const [p, t] = await Promise.all([getProject(id), getTasks(id)]);
    setProject(p.data);
    setTasks(t.data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.assignee) delete payload.assignee;
      await createTask(id, payload);
      setShowForm(false);
      setForm({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    await updateTask(id, task._id, { status: newStatus });
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t)));
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await deleteTask(id, taskId);
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  };

  if (loading) return <Layout><p>Loading...</p></Layout>;
  if (!project) return <Layout><p style={{ color: '#ef4444' }}>Project not found.</p></Layout>;

  const grouped = STATUSES.reduce((acc, s) => ({ ...acc, [s]: tasks.filter((t) => t.status === s) }), {});

  return (
    <Layout>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>{project.title}</h2>
          <p style={s.desc}>{project.description}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={s.btn}>
          {showForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={s.form}>
          <h3 style={s.formTitle}>New Task</h3>
          <input required placeholder="Task title" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} style={s.input} />
          <textarea placeholder="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ ...s.input, height: 72, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={s.select}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="date" value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={s.input} />
          </div>
          <button type="submit" disabled={saving} style={s.btn}>{saving ? 'Creating...' : 'Create Task'}</button>
        </form>
      )}

      {/* Kanban board */}
      <div style={s.board}>
        {STATUSES.map((status) => (
          <div key={status} style={s.column}>
            <div style={s.columnHeader}>
              <span style={{ ...s.statusDot, background: STATUS_COLORS[status] }} />
              <span style={s.columnTitle}>{status.replace('_', ' ')}</span>
              <span style={s.count}>{grouped[status].length}</span>
            </div>
            <div style={s.taskList}>
              {grouped[status].map((task) => (
                <div key={task._id} style={s.taskCard}>
                  <div style={s.taskTop}>
                    <span style={s.taskTitle}>{task.title}</span>
                    <span style={{ ...s.priorityBadge, color: PRIORITY_COLORS[task.priority] }}>
                      {task.priority}
                    </span>
                  </div>
                  {task.description && <p style={s.taskDesc}>{task.description}</p>}
                  {task.assignee && <p style={s.assignee}>@{task.assignee.name}</p>}
                  {task.dueDate && <p style={s.due}>Due {new Date(task.dueDate).toLocaleDateString()}</p>}
                  <div style={s.taskActions}>
                    <select value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value)}
                      style={{ ...s.select, fontSize: 11, padding: '3px 6px' }}>
                      {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                    <button onClick={() => handleDelete(task._id)} style={s.deleteMini}>×</button>
                  </div>
                </div>
              ))}
              {grouped[status].length === 0 && (
                <p style={s.emptyCol}>Empty</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { margin: 0, color: '#f1f5f9' },
  desc: { color: '#64748b', fontSize: 14, margin: '4px 0 0' },
  btn: { background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' },
  form: { background: '#1e293b', borderRadius: 10, padding: 24, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 },
  formTitle: { margin: 0, color: '#f1f5f9' },
  input: { padding: '9px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 13, width: '100%', boxSizing: 'border-box' },
  select: { padding: '9px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 13 },
  board: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  column: { background: '#1e293b', borderRadius: 10, padding: 16, minHeight: 300 },
  columnHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
  statusDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  columnTitle: { color: '#94a3b8', fontWeight: 600, fontSize: 13, textTransform: 'capitalize', flex: 1 },
  count: { background: '#0f172a', color: '#64748b', borderRadius: 99, padding: '1px 8px', fontSize: 11 },
  taskList: { display: 'flex', flexDirection: 'column', gap: 10 },
  taskCard: { background: '#0f172a', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 },
  taskTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  taskTitle: { color: '#e2e8f0', fontSize: 13, fontWeight: 600, lineHeight: 1.4 },
  priorityBadge: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 },
  taskDesc: { color: '#64748b', fontSize: 12, margin: 0 },
  assignee: { color: '#475569', fontSize: 11, margin: 0 },
  due: { color: '#475569', fontSize: 11, margin: 0 },
  taskActions: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 },
  deleteMini: { background: 'transparent', color: '#ef4444', border: '1px solid #ef444433', borderRadius: 4, width: 22, height: 22, cursor: 'pointer', fontSize: 14, padding: 0 },
  emptyCol: { color: '#334155', fontSize: 12, textAlign: 'center', paddingTop: 20 },
};
