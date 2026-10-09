import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import WorkshopForm from '../components/WorkshopForm';

const ymd = (d) => d.toLocaleDateString('en-CA');
const initial = { q: '', status: 'scheduled', from: '', to: '', hasSeats: false, page: 1 };

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

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

  // Derived metrics from loaded page
  const totalCapacity = data.items.reduce((s, w) => s + (w.capacity || 0), 0);
  const totalBooked   = data.items.reduce((s, w) => s + (w.activeCount || 0), 0);
  const bookedPct     = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;
  const scheduledCnt  = data.items.filter((w) => w.status === 'scheduled').length;
  const uniqueInstructors = [...new Set(data.items.map((w) => w.instructor).filter(Boolean))].length;

  return (
    <div className="w-full flex flex-col pb-10 overflow-x-hidden">
      {creating && <WorkshopForm onCancel={() => setCreating(false)} onSaved={(w) => nav(`/workshops/${w.id}`)} />}

      {/* ── Subheader ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-6 py-5 bg-surface-container-lowest shadow-sm mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface m-0 tracking-tight">Workshops</h1>
          <span className="font-title-md text-title-md text-on-surface-variant font-medium bg-surface-container px-2 py-0.5 rounded-lg">({data.total})</span>
        </div>
        <div className="flex items-center w-full sm:w-auto">
          {user?.role === 'manager' && (
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-md text-label-md transition-colors shadow-sm cursor-pointer" onClick={() => setCreating(true)}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New workshop</span>
              <span className="ml-1 bg-on-primary/20 text-on-primary px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Manager</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Metric tiles ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 px-4 sm:px-6 mb-6">
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant font-medium uppercase tracking-wider">Total Capacities</span>
            <span className="material-symbols-outlined text-primary bg-primary-container/20 p-1.5 rounded-lg text-[20px]">groups</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{totalCapacity}</span>
            <span className="font-label-sm text-label-sm text-secondary font-medium">{bookedPct}% booked</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${bookedPct}%` }} />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant font-medium uppercase tracking-wider">Scheduled Ahead</span>
            <span className="material-symbols-outlined text-surface-tint bg-surface-tint/10 p-1.5 rounded-lg text-[20px]">calendar_today</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{scheduledCnt} <span className="font-title-sm text-title-sm font-medium text-on-surface-variant">Sessions</span></span>
            <span className="font-label-sm text-label-sm text-primary font-medium">Next 7 days</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-surface-tint transition-all duration-500" style={{ width: '75%' }} />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant font-medium uppercase tracking-wider">Waitlisted Seats</span>
            <span className="material-symbols-outlined text-tertiary bg-tertiary/10 p-1.5 rounded-lg text-[20px]">how_to_reg</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">—</span>
            <span className="font-label-sm text-label-sm text-tertiary font-medium">Across centres</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-tertiary transition-all duration-500" style={{ width: '60%' }} />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant font-medium uppercase tracking-wider">Instructors Active</span>
            <span className="material-symbols-outlined text-secondary bg-secondary-container p-1.5 rounded-lg text-[20px]">badge</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{uniqueInstructors} <span className="font-title-sm text-title-sm font-medium text-on-surface-variant">Leads</span></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">All centres</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-secondary transition-all duration-500" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="px-4 sm:px-6 mb-6">
        <div className="bg-surface-container-lowest p-3 sm:p-4 rounded-2xl shadow-sm border border-outline-variant/40 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          <div className="w-full lg:w-72 xl:w-96 relative shrink-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">search</span>
            <input
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface text-on-surface font-body-md border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline"
              placeholder="Search title, code..."
              value={f.q}
              onChange={set('q')}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
            
            <div className="relative flex-1 sm:flex-none">
              <select className="w-full sm:w-auto h-11 pl-3 pr-8 rounded-xl bg-surface border border-outline-variant/50 text-on-surface font-body-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer" value={f.status} onChange={set('status')}>
                <option value="">Status: Any</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">expand_more</span>
            </div>
            
            <div className="flex items-center bg-surface border border-outline-variant/50 rounded-xl px-3 h-11 flex-1 sm:flex-none min-w-[240px]">
              <span className="text-label-sm text-on-surface-variant font-medium mr-2">From</span>
              <input type="date" className="bg-transparent border-none outline-none text-body-sm sm:text-body-md text-on-surface cursor-pointer w-full" value={f.from} onChange={set('from')} />
              <span className="text-label-sm text-on-surface-variant font-medium mx-2">To</span>
              <input type="date" className="bg-transparent border-none outline-none text-body-sm sm:text-body-md text-on-surface cursor-pointer w-full" value={f.to} onChange={set('to')} />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-body-md text-on-surface select-none py-2 px-1">
              <input type="checkbox" className="w-4.5 h-4.5 rounded border-outline-variant text-primary focus:ring-primary focus:ring-2 cursor-pointer" checked={f.hasSeats} onChange={set('hasSeats')} />
              <span className="whitespace-nowrap">Seats available</span>
            </label>

            <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 h-11 bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container rounded-xl font-label-md transition-colors cursor-pointer" type="button" onClick={thisWeekWithSeats}>
              <span className="material-symbols-outlined text-[18px]">event_upcoming</span>
              <span className="whitespace-nowrap">Next 7 days</span>
            </button>
            <button className="flex-1 sm:flex-none px-4 h-11 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl font-label-md transition-colors cursor-pointer" type="button" onClick={() => setF(initial)}>Reset</button>
          </div>
        </div>
      </div>

      {error && <div className="px-4 sm:px-6 mb-4"><p className="text-error font-body-md p-3 bg-error-container rounded-xl">{error}</p></div>}

      {/* ── Content area ── */}
      <div className="px-4 sm:px-6 w-full max-w-full">
        {loading ? (
          /* Skeleton */
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 p-4 sm:p-6 flex flex-col gap-4">
            <div className="h-6 w-1/3 sm:w-1/4 bg-surface-container animate-pulse rounded" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-3 border-b border-outline-variant/20 last:border-0">
                <div className="h-5 w-16 bg-surface-container animate-pulse rounded shrink-0" />
                <div className="h-5 w-full sm:flex-1 bg-surface-container animate-pulse rounded" />
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="h-8 w-8 bg-surface-container animate-pulse rounded-full shrink-0" />
                  <div className="h-5 w-32 bg-surface-container animate-pulse rounded" />
                </div>
                <div className="h-8 w-24 bg-surface-container animate-pulse rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        ) : data.items.length === 0 ? (
          /* Empty state */
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 py-16 px-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-on-surface-variant mb-4">
              <span className="material-symbols-outlined text-[32px]">search_off</span>
            </div>
            <h3 className="font-title-lg text-title-lg text-on-surface mb-2 font-semibold">No workshops match your filters</h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-6">
              Try loosening your date range, resetting seat availability checkboxes, or clearing specific centre filters.
            </p>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-surface-container text-on-surface-variant hover:bg-outline-variant/40 rounded-xl font-label-md transition-colors cursor-pointer" onClick={() => setF(initial)}>
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              <span>Reset filters</span>
            </button>
          </div>
        ) : (
          /* Table */
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left min-w-[900px] border-collapse">
                <thead>
                  <tr className="bg-surface border-b border-outline-variant/40">
                    <th className="py-4 px-4 sm:px-5 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Code</th>
                    <th className="py-4 px-4 sm:px-5 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Workshop Title</th>
                    <th className="py-4 px-4 sm:px-5 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Instructor</th>
                    <th className="py-4 px-4 sm:px-5 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">When</th>
                    <th className="py-4 px-4 sm:px-5 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Location</th>
                    <th className="py-4 px-4 sm:px-5 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider w-48">Seats &amp; Status</th>
                    <th className="py-4 px-4 sm:px-5 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {data.items.map((w) => {
                    const pct = w.capacity > 0 ? Math.round((w.activeCount / w.capacity) * 100) : 0;
                    const isFull = w.seatsAvailable === 0 && w.status === 'scheduled';
                    const isCompleted = w.status === 'completed';
                    const isCancelled = w.status === 'cancelled';
                    const initials = getInitials(w.instructor);
                    const seatColor = pct >= 80 ? 'var(--color-error)' : pct >= 50 ? 'var(--color-tertiary)' : 'var(--color-secondary)';
                    
                    const mutedClass = (isCancelled || isCompleted) ? 'opacity-60 grayscale-[0.2]' : '';

                    return (
                      <tr key={w.id} className={`hover:bg-surface-container-lowest/60 transition-colors ${isCancelled ? 'bg-error-container/10' : ''}`}>
                        {/* Code */}
                        <td className={`py-4 px-4 sm:px-5 font-mono text-body-sm text-on-surface-variant ${mutedClass}`}>
                          {w.code}
                        </td>

                        {/* Title */}
                        <td className="py-4 px-4 sm:px-5">
                          <Link
                            to={`/workshops/${w.id}`}
                            className={`font-title-md text-title-md text-primary hover:underline font-semibold block mb-1 ${isCancelled ? 'line-through !text-on-surface-variant' : ''}`}
                          >
                            {w.title}
                          </Link>
                          {isCancelled && w.description && (
                            <div className="flex items-start gap-1 text-error text-body-sm mt-1">
                              <span className="material-symbols-outlined text-[14px] mt-0.5">info</span>
                              <span className="leading-tight">{w.description}</span>
                            </div>
                          )}
                        </td>

                        {/* Instructor */}
                        <td className="py-4 px-4 sm:px-5">
                          <div className={`flex items-center gap-2.5 ${mutedClass}`}>
                            <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-label-md font-bold shrink-0">
                              {initials}
                            </div>
                            <div className="font-body-md text-on-surface font-medium line-clamp-1">
                              {w.instructor || '—'}
                            </div>
                          </div>
                        </td>

                        {/* When */}
                        <td className="py-4 px-4 sm:px-5">
                          <div className={`flex flex-col gap-0.5 ${mutedClass}`}>
                            <div className="flex items-center gap-1.5 font-body-md text-on-surface font-medium">
                              <span className={`material-symbols-outlined text-[16px] ${isCancelled ? 'text-error' : isCompleted ? 'text-secondary' : 'text-primary'}`}>
                                {isCancelled ? 'event_busy' : isCompleted ? 'check_circle' : 'schedule'}
                              </span>
                              <span className="whitespace-nowrap">{fmtDate(w.startsAt)}</span>
                            </div>
                            <div className="text-body-sm text-on-surface-variant ml-5.5 whitespace-nowrap">{fmtTime(w.startsAt)}</div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-4 px-4 sm:px-5">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container font-body-sm text-on-surface-variant whitespace-nowrap ${mutedClass}`}>
                            {!isCancelled && <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>}
                            <span>{w.location || '—'}</span>
                          </div>
                        </td>

                        {/* Seats & Status */}
                        <td className="py-4 px-4 sm:px-5">
                          {isCompleted ? (
                            <div className="flex flex-col gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-caps text-label-caps w-fit font-bold tracking-wide">
                                <span className="material-symbols-outlined text-[12px]">done</span>
                                COMPLETED
                              </span>
                              <span className="text-body-sm text-on-surface-variant font-medium">{w.activeCount} attended</span>
                            </div>
                          ) : isCancelled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-caps text-label-caps w-fit font-bold tracking-wide">
                              <span className="material-symbols-outlined text-[12px]">cancel</span>
                              CANCELLED
                            </span>
                          ) : isFull ? (
                            <div className="flex flex-col gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error/10 text-error font-label-caps text-label-caps w-fit font-bold tracking-wide">
                                FULL (0 of {w.capacity})
                              </span>
                              <span className="inline-flex px-2 py-0.5 rounded bg-primary-container/30 text-primary font-label-caps text-[10px] uppercase font-bold tracking-wider w-fit">
                                SCHEDULED
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1.5 w-full">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-label-sm font-semibold whitespace-nowrap" style={{ color: seatColor }}>
                                  {w.seatsAvailable} left of {w.capacity}
                                </span>
                                <span className="inline-flex px-1.5 py-0.5 rounded bg-primary-container/30 text-primary font-label-caps text-[10px] uppercase font-bold tracking-wider">
                                  SCHED
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: seatColor }} />
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 sm:px-5 text-right">
                          <Link 
                            to={`/workshops/${w.id}`} 
                            className={`inline-flex items-center gap-1 font-label-md text-label-md font-semibold text-primary hover:text-primary-container transition-colors ${isCancelled ? 'text-on-surface-variant hover:text-on-surface' : ''}`}
                          >
                            <span>{isCancelled ? 'Audit' : isCompleted ? 'Summary' : 'Roster'}</span>
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-surface border-t border-outline-variant/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-body-sm text-on-surface-variant text-center sm:text-left">
                Showing <strong className="text-on-surface font-semibold">{(data.page - 1) * 8 + 1}</strong> to{' '}
                <strong className="text-on-surface font-semibold">{Math.min(data.page * 8, data.total)}</strong> of{' '}
                <strong className="text-on-surface font-semibold">{data.total}</strong> workshops
                <span className="ml-2 pl-2 border-l border-outline-variant/50 hidden sm:inline-block">Page {data.page} of {data.pages}</span>
              </div>
              <div className="flex flex-wrap justify-center sm:justify-end items-center gap-1.5">
                <button 
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/50 text-label-md font-medium hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-on-surface"
                  disabled={f.page <= 1} 
                  onClick={() => setF({ ...f, page: f.page - 1 })}
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  <span className="hidden sm:inline">Prev</span>
                </button>
                <div className="flex items-center gap-1 px-1 sm:px-2">
                  {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                    <button 
                      key={p} 
                      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-label-md font-medium transition-colors ${p === data.page ? 'bg-primary text-on-primary' : 'hover:bg-surface-container text-on-surface-variant'}`}
                      onClick={() => setF({ ...f, page: p })}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button 
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant/50 text-label-md font-medium hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-on-surface"
                  disabled={f.page >= data.pages} 
                  onClick={() => setF({ ...f, page: f.page + 1 })}
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
