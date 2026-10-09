import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import DataTable from '../components/DataTable';
import WorkshopForm from '../components/WorkshopForm';

const when = (d) => (d ? new Date(d).toLocaleString() : '—');

export default function WorkshopDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isManager = user.role === 'manager';
  const [w, setW] = useState(null);
  const [regs, setRegs] = useState([]);
  const [history, setHistory] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        api.get(`/workshops/${id}`),
        api.get(`/workshops/${id}/registrations`, { params: { status: history ? 'all' : 'active' } }),
      ]);
      setW(a.data); setRegs(b.data.items);
    } catch (e) { setError(errMsg(e)); }
  }, [id, history]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn) => {
    setBusy(true); setError('');
    try { await fn(); await load(); } catch (e) { setError(errMsg(e)); await load(); } // reload: counts may have changed
    finally { setBusy(false); }
  };

  const register = (e) => {
    e.preventDefault();
    act(async () => { await api.post(`/workshops/${id}/registrations`, form); setForm({ name: '', email: '' }); });
  };
  const cancel = (r) => {
    const reason = prompt(`Cancel ${r.name}'s registration? Optional reason:`);
    if (reason === null) return;
    act(() => api.post(`/registrations/${r.id}/cancel`, { reason }));
  };
  const setStatus = (status) => confirm(`Mark this workshop as ${status}?`) && act(() => api.patch(`/workshops/${id}/status`, { status }));

  if (!w) return error ? <p className="error">{error}</p> : <p>Loading…</p>;
  if (editing) return <WorkshopForm workshop={w} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />;

  const open = w.status === 'scheduled' && new Date(w.startsAt) > new Date();
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status', render: (r) => <span className={`badge ${r.status}`}>{r.status}</span> },
    { key: 'reg', label: 'Registered', render: (r) => `${when(r.createdAt)} by ${r.registeredBy?.name ?? '?'}` },
    ...(history ? [{ key: 'can', label: 'Cancelled', render: (r) =>
        r.status === 'cancelled' ? `${when(r.cancelledAt)} by ${r.cancelledBy?.name ?? '?'}${r.cancelReason ? ` (${r.cancelReason})` : ''}` : '—' }] : []),
    { key: 'act', label: '', render: (r) => r.status === 'active' && <button disabled={busy} onClick={() => cancel(r)}>Cancel</button> },
  ];

  return (
    <>
      <h2>{w.code}: {w.title} <span className={`badge ${w.status}`}>{w.status}</span></h2>
      <p>{w.instructor} · {when(w.startsAt)} · {w.durationMinutes} min · {w.location}{w.category && ` · ${w.category}`}</p>
      {w.description && <p>{w.description}</p>}
      <p><b>{w.activeCount}</b> of <b>{w.capacity}</b> seats taken · <b>{w.seatsAvailable}</b> available</p>

      {isManager && w.status === 'scheduled' && (
        <div className="row">
          <button onClick={() => setEditing(true)}>Edit</button>
          <button onClick={() => setStatus('completed')}>Mark completed</button>
          <button className="danger-btn" onClick={() => setStatus('cancelled')}>Cancel workshop</button>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {open && (w.seatsAvailable > 0 ? (
        <form onSubmit={register} className="form">
          <h3>Register an attendee</h3>
          <div className="row">
            <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Register'}</button>
          </div>
        </form>
      ) : <p className="banner">This workshop is full.</p>)}

      <div className="row between">
        <h3>{history ? 'All registrations (history)' : 'Active registrations'}</h3>
        <label><input type="checkbox" checked={history} onChange={(e) => setHistory(e.target.checked)} /> Show cancelled / history</label>
      </div>
      <DataTable columns={columns} rows={regs} empty="No registrations yet" />
    </>
  );
}