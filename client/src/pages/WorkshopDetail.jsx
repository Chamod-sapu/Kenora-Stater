import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import WorkshopForm from '../components/WorkshopForm';

const when = (d) => (d ? new Date(d).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—');
const getInitials = (name) => name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '??';

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
  const [cancelData, setCancelData] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

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
    try { await fn(); await load(); } catch (e) { setError(errMsg(e)); await load(); } 
    finally { setBusy(false); }
  };

  const register = (e) => {
    e.preventDefault();
    act(async () => { await api.post(`/workshops/${id}/registrations`, form); setForm({ name: '', email: '' }); });
  };
  
  const confirmCancel = () => {
    if (!cancelData) return;
    const r = cancelData;
    const reason = cancelReason;
    setCancelData(null);
    setCancelReason('');
    act(() => api.post(`/registrations/${r.id}/cancel`, { reason }));
  };

  const setStatus = (status) => window.confirm(`Mark this workshop as ${status}?`) && act(() => api.patch(`/workshops/${id}/status`, { status }));

  if (!w) return (
    <div className="flex flex-col w-full">
      {error ? <div className="p-4 rounded-xl bg-error-container text-on-error-container">{error}</div> : <div className="animate-pulse flex gap-2 text-on-surface-variant"><span className="material-symbols-outlined animate-spin">progress_activity</span> Loading...</div>}
    </div>
  );

  const open = w.status === 'scheduled' && new Date(w.startsAt) > new Date();
  const bookedPct = w.capacity > 0 ? Math.round(((w.activeCount || 0) / w.capacity) * 100) : 0;

  return (
    <div className="flex flex-col w-full">
      {editing && <WorkshopForm workshop={w} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />}
      {error && <p className="p-4 mb-4 rounded-xl bg-error-container text-on-error-container font-body-md shadow-sm border border-error/20">{error}</p>}

      {/* 1. Breadcrumb navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs mb-space-md">
        <Link to="/" className="font-label-lg text-label-lg text-primary hover:underline flex items-center gap-1 transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Workshops</span>
        </Link>
        <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
        <span className="font-label-lg text-label-lg text-on-surface-variant font-semibold">{w.code}</span>
      </nav>

      {/* 2. Header Card */}
      <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm mb-space-lg">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-space-md">
          {/* Left Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-space-sm mb-space-xs">
              <h1 className="font-headline-lg text-headline-lg text-on-surface">{w.code}: {w.title}</h1>
              <span className={`inline-flex items-center px-space-sm py-0.5 rounded-full font-label-md text-label-md ${w.status === 'scheduled' ? 'bg-surface-container text-primary' : w.status === 'completed' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'} font-medium`}>
                {w.status}
              </span>
            </div>
            <div className="font-body-md text-body-md text-on-surface-variant font-medium mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-on-surface font-semibold">{w.instructor || 'Unassigned'}</span>
              <span className="text-outline">•</span>
              <span>{when(w.startsAt)}</span>
              <span className="text-outline">•</span>
              <span>{w.durationMinutes} min</span>
              <span className="text-outline">•</span>
              <span className="inline-flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                {w.location || 'TBA'}
              </span>
              {w.category && (
                <>
                  <span className="text-outline">•</span>
                  <span className="bg-surface-container-low text-on-surface-variant px-space-xs py-0.5 rounded font-label-caps text-label-caps uppercase">{w.category}</span>
                </>
              )}
            </div>
            {w.description && <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-2xl">{w.description}</p>}
          </div>

          {/* Right Action Group */}
          {isManager && w.status === 'scheduled' && (
            <div className="flex items-center flex-wrap gap-space-sm self-start">
              <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-lg text-label-lg px-space-md py-2 rounded-xl transition-colors shadow-sm" type="button">
                <span className="material-symbols-outlined text-[18px]">edit</span>
                <span>Edit</span>
              </button>
              <button onClick={() => setStatus('completed')} className="inline-flex items-center gap-1.5 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-lg text-label-lg px-space-md py-2 rounded-xl transition-colors shadow-sm" type="button">
                <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
                <span>Mark completed</span>
              </button>
              <button onClick={() => setStatus('cancelled')} className="inline-flex items-center gap-1.5 bg-surface-container-lowest hover:bg-error-container text-error font-label-lg text-label-lg px-space-md py-2 rounded-xl transition-colors shadow-sm" type="button">
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                <span>Cancel workshop</span>
              </button>
            </div>
          )}
        </div>

        {/* Seat Progress Section */}
        <div className="mt-space-lg pt-space-md bg-surface-container-low rounded-xl p-space-md">
          <div className="flex justify-between items-center mb-space-sm font-label-lg text-label-lg text-on-surface">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[20px]">groups</span>
              <span className="font-semibold text-on-surface">Seat Capacity</span>
              <span className="text-on-surface-variant">— {w.activeCount || 0} of {w.capacity} seats taken</span>
            </div>
            <div className={`flex items-center gap-space-xs font-semibold ${w.seatsAvailable === 0 ? 'text-error' : 'text-secondary'}`}>
              <span className={`inline-block w-2 h-2 rounded-full ${w.seatsAvailable === 0 ? 'bg-error' : 'bg-secondary'}`}></span>
              <span>{w.seatsAvailable} seats available</span>
            </div>
          </div>
          <div className="h-2.5 bg-surface-container-highest rounded-full overflow-hidden w-full relative">
            <div className={`h-full rounded-full transition-all duration-500 ease-out ${w.seatsAvailable === 0 ? 'bg-error' : 'bg-primary-container'}`} style={{ width: `${bookedPct}%` }}></div>
          </div>
        </div>
      </section>

      {/* 3. Register an Attendee Card */}
      {open ? (
        <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm mb-space-lg">
          <div className="flex items-center justify-between mb-space-md">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[22px]">person_add</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Register an attendee</h2>
            </div>
            {w.seatsAvailable <= 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-200 text-amber-900" style={{ backgroundColor: '#fde68a', color: '#78350f' }}>Waitlist Only</span>
            )}
          </div>
          {w.seatsAvailable <= 0 && (
             <p className="font-body-md text-body-md text-amber-900 leading-relaxed mb-4" style={{ color: '#78350f' }}>This workshop is currently full. New registrations will be placed on the waitlist.</p>
          )}
          <form className="flex flex-col md:flex-row items-end gap-space-md" onSubmit={register}>
            <div className="flex-1 w-full">
              <label className="block font-label-md text-label-md text-on-surface mb-1.5 font-medium" htmlFor="attendee-name">Full name</label>
              <div className="relative flex items-center">
                <input required className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-sm" id="attendee-name" placeholder="e.g. Kasun Silva" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/>
              </div>
            </div>
            <div className="flex-1 w-full">
              <label className="block font-label-md text-label-md text-on-surface mb-1.5 font-medium" htmlFor="attendee-email">Email address</label>
              <div className="relative flex items-center">
                <input required className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-sm" id="attendee-email" placeholder="e.g. kasun@example.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/>
              </div>
            </div>
            <button disabled={busy} className="w-full md:w-auto h-10 px-space-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg rounded-xl whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50" type="submit">
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>{busy ? 'Processing...' : (w.seatsAvailable > 0 ? 'Register' : 'Join Waitlist')}</span>
            </button>
          </form>
        </section>
      ) : (
        <section className="bg-surface-container-low text-on-surface-variant rounded-xl p-space-lg shadow-sm mb-space-lg flex items-center gap-4">
          <span className="material-symbols-outlined text-[32px]">event_busy</span>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Registration Closed</h2>
            <p className="font-body-md text-body-md">This workshop is either completed, cancelled, or has already started.</p>
          </div>
        </section>
      )}

      {/* 4. Active Registrations Card */}
      <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
          <div className="flex items-center gap-space-xs">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{history ? 'Registrations history' : 'Active registrations'}</h2>
            <span className="bg-surface-container text-on-surface-variant font-label-caps text-label-caps px-space-xs py-0.5 rounded-full font-semibold">
              {history ? `${regs.length} Total` : `${regs.length} Confirmed`}
            </span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none text-on-surface-variant font-label-lg text-label-lg hover:text-on-surface transition-colors">
            <input checked={history} onChange={(e) => setHistory(e.target.checked)} className="w-4 h-4 rounded text-primary-container focus:ring-0 bg-surface-container cursor-pointer" type="checkbox"/>
            <span>Show cancelled / history</span>
          </label>
        </div>

        {/* Attendees Table */}
        <div className="rounded-xl overflow-hidden bg-surface-container-lowest shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  <th className="py-3.5 px-space-md" scope="col">Name</th>
                  <th className="py-3.5 px-space-md" scope="col">Email</th>
                  <th className="py-3.5 px-space-md" scope="col">Status</th>
                  <th className="py-3.5 px-space-md" scope="col">Registered</th>
                  {history && <th className="py-3.5 px-space-md" scope="col">Cancelled</th>}
                  <th className="py-3.5 px-space-md text-right" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low font-body-md text-body-md">
                {regs.length === 0 && (
                  <tr>
                    <td colSpan={history ? 6 : 5} className="py-8 text-center text-on-surface-variant">No registrations found.</td>
                  </tr>
                )}
                {regs.map(r => (
                  r.status !== 'cancelled' ? (
                    <tr key={r.id} className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="py-3.5 px-space-md font-semibold text-on-surface">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-surface-container-highest text-primary flex items-center justify-center font-label-caps text-label-caps font-bold">{getInitials(r.name)}</div>
                          <span>{r.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-space-md text-on-surface-variant">{r.email}</td>
                      <td className="py-3.5 px-space-md">
                        {r.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 bg-secondary-container/40 text-on-secondary-container px-2.5 py-0.5 rounded-full font-label-md text-label-md font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                            active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-tertiary-container/40 text-on-tertiary-container px-2.5 py-0.5 rounded-full font-label-md text-label-md font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            waitlisted
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-space-md text-on-surface-variant font-body-sm text-body-sm">
                        {when(r.createdAt)} <span className="text-outline text-xs">by {r.registeredBy?.name ?? '?'}</span>
                      </td>
                      {history && <td className="py-3.5 px-space-md text-outline font-body-sm text-body-sm">—</td>}
                      <td className="py-3.5 px-space-md text-right">
                        <button disabled={busy} onClick={() => setCancelData(r)} className="bg-surface-container-lowest hover:bg-error-container text-on-surface-variant hover:text-error font-label-md text-label-md px-2.5 py-1 rounded transition-colors shadow-sm disabled:opacity-50" type="button">
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={r.id} className="bg-surface-container-low/30 hover:bg-surface-container-low/50 transition-colors text-outline">
                      <td className="py-3.5 px-space-md font-medium">
                        <div className="flex items-center gap-2 line-through">
                          <div className="w-7 h-7 rounded-full bg-surface-container text-outline flex items-center justify-center font-label-caps text-label-caps">{getInitials(r.name)}</div>
                          <span>{r.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-space-md line-through text-outline">{r.email}</td>
                      <td className="py-3.5 px-space-md">
                        <span className="inline-flex items-center gap-1 bg-error-container text-on-error-container px-2.5 py-0.5 rounded-full font-label-md text-label-md font-medium">
                          cancelled
                        </span>
                      </td>
                      <td className="py-3.5 px-space-md font-body-sm text-body-sm text-outline">
                        {when(r.createdAt)} <span className="text-outline text-xs">by {r.registeredBy?.name ?? '?'}</span>
                      </td>
                      {history && (
                        <td className="py-3.5 px-space-md font-body-sm text-body-sm text-outline">
                          {when(r.cancelledAt)} <span className="text-outline text-xs">by {r.cancelledBy?.name ?? '?'} {r.cancelReason && `(${r.cancelReason})`}</span>
                        </td>
                      )}
                      <td className="py-3.5 px-space-md text-right font-label-md text-label-md text-outline">
                        Archived
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Cancel Dialog Modal */}
      {cancelData && (
        <div aria-labelledby="modal-title" aria-modal="true" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                  <span className="material-symbols-outlined text-[26px]">person_remove</span>
                </div>
                <button aria-label="Close dialog" className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors inline-flex items-center justify-center" onClick={() => setCancelData(null)} type="button">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight" id="modal-title">Cancel {cancelData.name}'s registration?</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  This will cancel the booking for {cancelData.name} and open up 1 seat in <span className="font-semibold text-slate-800">{w.code}: {w.title}</span>. This action will be logged in the audit history.
                </p>
              </div>
              <div className="mb-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2" htmlFor="cancel-reason">Reason for cancellation (optional)</label>
                <textarea className="w-full px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50/50 resize-none shadow-sm transition-all" id="cancel-reason" placeholder="e.g., Attendee requested refund, schedule conflict, unwell..." rows="3" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}></textarea>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 shadow-sm" onClick={() => setCancelData(null)} type="button">Keep registration</button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-2" onClick={confirmCancel} type="button">
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                  <span>Cancel registration</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}