import { useEffect, useState } from 'react';
import { getUsers, updateUser, deleteUser } from '../api/users';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getUsers()
      .then(({ data }) => setUsers(data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleActive = async (u) => {
    await updateUser(u._id, { isActive: !u.isActive });
    setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, isActive: !x.isActive } : x)));
  };

  const changeRole = async (u, role) => {
    await updateUser(u._id, { role });
    setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, role } : x)));
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete ${u.name}? This is irreversible.`)) return;
    await deleteUser(u._id);
    setUsers((prev) => prev.filter((x) => x._id !== u._id));
  };

  return (
    <Layout>
      <h2 style={s.title}>Admin Panel</h2>
      <p style={s.subtitle}>{users.length} registered users</p>
      {loading ? <p>Loading...</p> : (
        <table style={s.table}>
          <thead>
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} style={{ opacity: u.isActive ? 1 : 0.5 }}>
                <td style={s.td}>{u.name} {u._id === me._id && <em style={s.you}>(you)</em>}</td>
                <td style={s.td}>{u.email}</td>
                <td style={s.td}>
                  <select value={u.role}
                    onChange={(e) => changeRole(u, e.target.value)}
                    disabled={u._id === me._id}
                    style={s.roleSelect}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td style={s.td}>
                  <span style={{ ...s.badge, background: u.isActive ? '#14532d' : '#450a0a', color: u.isActive ? '#86efac' : '#fca5a5' }}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={s.td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={s.td}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => toggleActive(u)} disabled={u._id === me._id} style={s.actionBtn}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(u)} disabled={u._id === me._id} style={{ ...s.actionBtn, color: '#ef4444', borderColor: '#ef4444' }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}

const s = {
  title: { color: '#f1f5f9', marginBottom: 4 },
  subtitle: { color: '#64748b', fontSize: 14, marginBottom: 24 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', color: '#64748b', fontSize: 11, fontWeight: 700, padding: '8px 12px', borderBottom: '2px solid #1e293b', textTransform: 'uppercase' },
  td: { padding: '14px 12px', borderBottom: '1px solid #1e293b', fontSize: 13, color: '#cbd5e1', verticalAlign: 'middle' },
  badge: { fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 99 },
  you: { color: '#64748b', fontSize: 11 },
  roleSelect: { background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '4px 8px', fontSize: 12 },
  actionBtn: { background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 },
};
