import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import DataTable from '../components/DataTable';

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [error, setError] = useState('');

  const load = () => api.get('/users').then((r) => setUsers(r.data.users)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);

  const run = async (fn) => { setError(''); try { await fn(); load(); } catch (e) { setError(errMsg(e)); } };
  const create = (e) => {
    e.preventDefault();
    run(async () => { await api.post('/users', form); setForm({ ...form, name: '', email: '', password: '' }); });
  };
  const patch = (id, body) => run(() => api.patch(`/users/${id}`, body));

  const columns = [
    { key: 'name', label: 'Name', render: (u) => `${u.name}${u.id === me.id ? ' (you)' : ''}` },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (u) => (
        <select value={u.role} disabled={u.id === me.id} onChange={(e) => patch(u.id, { role: e.target.value })}>
          {['admin', 'manager', 'staff'].map((r) => <option key={r}>{r}</option>)}
        </select>) },
    { key: 'isActive', label: 'Active', render: (u) => (
        <button disabled={u.id === me.id} onClick={() => patch(u.id, { isActive: !u.isActive })}>
          {u.isActive ? 'Deactivate' : 'Reactivate'}
        </button>) },
  ];

  return (
    <>
      <h2>Staff accounts</h2>
      <form onSubmit={create} className="form">
        <div className="row">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input type="password" placeholder="Temporary password (8+)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {['staff', 'manager', 'admin'].map((r) => <option key={r}>{r}</option>)}
          </select>
          <button type="submit">Create account</button>
        </div>
      </form>
      {error && <p className="error">{error}</p>}
      <DataTable columns={columns} rows={users} empty="No users" />
    </>
  );
}