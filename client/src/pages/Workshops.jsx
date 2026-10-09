import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import DataTable from '../components/DataTable';
import WorkshopForm from '../components/WorkshopForm';

const ymd = (d) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
const initial = { q: '', status: 'scheduled', from: '', to: '', hasSeats: false, page: 1 };

export default function Workshops() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState(initial);
  const [data, setData] = useState({ items: [], total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const params = { page: f.page };
    if (f.q) params.q = f.q;
    if (f.status) params.status = f.status;
    if (f.from) params.from = new Date(`${f.from}T00:00:00`).toISOString();
    if (f.to) params.to = new Date(`${f.to}T23:59:59.999`).toISOString();
    if (f.hasSeats) params.hasSeats = 'true';
    try { setData((await api.get('/workshops', { params })).data); }
    catch (e) { setError(errMsg(e)); }
    finally { setLoading(false); }
  }, [f]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value, page: 1 });
  const thisWeekWithSeats = () => {
    const a = new Date(), b = new Date();
    b.setDate(b.getDate() + 7);
    setF({ ...f, from: ymd(a), to: ymd(b), hasSeats: true, status: 'scheduled', page: 1 });
  };

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'title', label: 'Title', render: (w) => <Link to={`/workshops/${w.id}`}>{w.title}</Link> },
    { key: 'instructor', label: 'Instructor' },
    { key: 'startsAt', label: 'When', render: (w) => new Date(w.startsAt).toLocaleString() },
    { key: 'location', label: 'Location' },
    { key: 'seats', label: 'Seats', render: (w) =>
        w.status !== 'scheduled' ? <span className={`badge ${w.status}`}>{w.status}</span>
        : w.seatsAvailable === 0 ? <span className="badge full">Full</span>
        : <span>{w.seatsAvailable} left of {w.capacity}</span> },
  ];

  return (
    <>
      <div className="row between">
        <h2>Workshops ({data.total})</h2>
        {user.role === 'manager' && <button onClick={() => setCreating(true)}>+ New workshop</button>}
      </div>
      {creating && <WorkshopForm onCancel={() => setCreating(false)} onSaved={(w) => nav(`/workshops/${w.id}`)} />}

      <div className="row filters">
        <input placeholder="Search title, code, instructor…" value={f.q} onChange={set('q')} />
        <select value={f.status} onChange={set('status')}>
          <option value="">Any status</option>
          {['scheduled', 'completed', 'cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <label>From <input type="date" value={f.from} onChange={set('from')} /></label>
        <label>To <input type="date" value={f.to} onChange={set('to')} /></label>
        <label><input type="checkbox" checked={f.hasSeats} onChange={set('hasSeats')} /> Seats available</label>
        <button type="button" onClick={thisWeekWithSeats}>Next 7 days with seats</button>
        <button type="button" onClick={() => setF(initial)}>Reset</button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? <p>Loading…</p> : <DataTable columns={columns} rows={data.items} empty="No workshops match" />}

      <div className="row pager">
        <button disabled={f.page <= 1} onClick={() => setF({ ...f, page: f.page - 1 })}>Prev</button>
        <span>Page {data.page} of {data.pages}</span>
        <button disabled={f.page >= data.pages} onClick={() => setF({ ...f, page: f.page + 1 })}>Next</button>
      </div>
    </>
  );
}