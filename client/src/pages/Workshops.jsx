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
    <>
      {creating && <WorkshopForm onCancel={() => setCreating(false)} onSaved={(w) => nav(`/workshops/${w.id}`)} />}

      {/* ── Subheader ── */}
      <div className="ws-subheader">
        <div className="ws-subheader-left">
          <div className="ws-breadcrumb">
            <span className="ws-breadcrumb-label">Operations Dashboard</span>
            <span className="ws-breadcrumb-dot" />
            <span className="ws-breadcrumb-term">Active Term: May 2025</span>
          </div>
          <div className="ws-title-row">
            <h1 className="ws-title">Workshops</h1>
            <span className="ws-count">({data.total})</span>
          </div>
          <p className="ws-desc">Manage schedules, seat capacities, and enrolments across all community centres.</p>
        </div>
        <div className="ws-subheader-right">
          {user.role === 'manager' && (
            <button className="ws-new-btn" onClick={() => setCreating(true)}>
              <span className="material-symbols-outlined">add</span>
              <span>New workshop</span>
              <span className="ws-new-badge">Manager</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Metric tiles ── */}
      <div className="ws-metrics">
        <div className="ws-metric-card">
          <div className="ws-metric-header">
            <span className="ws-metric-label">Total Capacities</span>
            <span className="material-symbols-outlined ws-metric-icon ws-metric-icon--primary">groups</span>
          </div>
          <div className="ws-metric-value-row">
            <span className="ws-metric-value">{totalCapacity}</span>
            <span className="ws-metric-sub ws-metric-sub--green">{bookedPct}% booked</span>
          </div>
          <div className="ws-metric-bar-track">
            <div className="ws-metric-bar ws-metric-bar--primary" style={{ width: `${bookedPct}%` }} />
          </div>
        </div>
        <div className="ws-metric-card">
          <div className="ws-metric-header">
            <span className="ws-metric-label">Scheduled Ahead</span>
            <span className="material-symbols-outlined ws-metric-icon ws-metric-icon--tint">calendar_today</span>
          </div>
          <div className="ws-metric-value-row">
            <span className="ws-metric-value">{scheduledCnt} Sessions</span>
            <span className="ws-metric-sub ws-metric-sub--primary">Next 7 days</span>
          </div>
          <div className="ws-metric-bar-track">
            <div className="ws-metric-bar ws-metric-bar--tint" style={{ width: '75%' }} />
          </div>
        </div>
        <div className="ws-metric-card">
          <div className="ws-metric-header">
            <span className="ws-metric-label">Waitlisted Seats</span>
            <span className="material-symbols-outlined ws-metric-icon ws-metric-icon--tertiary">how_to_reg</span>
          </div>
          <div className="ws-metric-value-row">
            <span className="ws-metric-value">—</span>
            <span className="ws-metric-sub ws-metric-sub--tertiary">Across centres</span>
          </div>
          <div className="ws-metric-bar-track">
            <div className="ws-metric-bar ws-metric-bar--tertiary" style={{ width: '60%' }} />
          </div>
        </div>
        <div className="ws-metric-card">
          <div className="ws-metric-header">
            <span className="ws-metric-label">Instructors Active</span>
            <span className="material-symbols-outlined ws-metric-icon ws-metric-icon--green">badge</span>
          </div>
          <div className="ws-metric-value-row">
            <span className="ws-metric-value">{uniqueInstructors} Leads</span>
            <span className="ws-metric-sub ws-metric-sub--muted">All centres</span>
          </div>
          <div className="ws-metric-bar-track">
            <div className="ws-metric-bar ws-metric-bar--green" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="ws-filter-bar">
        <div className="ws-filter-inner">
          <div className="ws-search-wrap">
            <span className="material-symbols-outlined ws-search-icon">search</span>
            <input
              className="ws-search-input"
              placeholder="Search title, code, instructor"
              value={f.q}
              onChange={set('q')}
            />
          </div>
          <div className="ws-filters">
            <div className="ws-select-wrap">
              <select className="ws-select" value={f.status} onChange={set('status')}>
                <option value="">Status: Any</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <span className="material-symbols-outlined ws-select-arrow">expand_more</span>
            </div>
            <div className="ws-date-range">
              <span className="ws-date-label">From</span>
              <input type="date" className="ws-date-input" value={f.from} onChange={set('from')} />
              <span className="ws-date-label">To</span>
              <input type="date" className="ws-date-input" value={f.to} onChange={set('to')} />
            </div>
            <label className="ws-seats-label">
              <input type="checkbox" className="ws-seats-check" checked={f.hasSeats} onChange={set('hasSeats')} />
              <span>Seats available</span>
            </label>
            <button className="ws-week-btn" type="button" onClick={thisWeekWithSeats}>
              <span className="material-symbols-outlined">event_upcoming</span>
              <span>Next 7 days with seats</span>
            </button>
            <button className="ws-reset-btn" type="button" onClick={() => setF(initial)}>Reset</button>
          </div>
        </div>
      </div>

      {error && <p className="error" style={{ marginBottom: '1rem' }}>{error}</p>}

      {/* ── Content area ── */}
      {loading ? (
        /* Skeleton */
        <div className="ws-skeleton">
          <div className="ws-skeleton-header" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="ws-skeleton-row">
              <div className="ws-skeleton-cell ws-skeleton-cell--sm" />
              <div className="ws-skeleton-cell ws-skeleton-cell--lg" />
              <div className="ws-skeleton-avatar" />
              <div className="ws-skeleton-cell ws-skeleton-cell--md" />
              <div className="ws-skeleton-cell ws-skeleton-cell--sm" />
              <div className="ws-skeleton-cell ws-skeleton-cell--md" />
            </div>
          ))}
        </div>
      ) : data.items.length === 0 ? (
        /* Empty state */
        <div className="ws-empty">
          <div className="ws-empty-icon-wrap">
            <span className="material-symbols-outlined ws-empty-icon">search_off</span>
          </div>
          <h3 className="ws-empty-title">No workshops match your filters</h3>
          <p className="ws-empty-desc">
            Try loosening your date range, resetting seat availability checkboxes, or clearing specific centre filters.
          </p>
          <button className="ws-new-btn" onClick={() => setF(initial)}>
            <span className="material-symbols-outlined">restart_alt</span>
            <span>Reset filters</span>
          </button>
        </div>
      ) : (
        /* Table */
        <div className="ws-table-card">
          <div className="ws-table-scroll">
            <table className="ws-table">
              <thead>
                <tr className="ws-thead-row">
                  <th className="ws-th ws-th--code">Code</th>
                  <th className="ws-th ws-th--title">Workshop Title</th>
                  <th className="ws-th ws-th--instructor">Instructor</th>
                  <th className="ws-th ws-th--when">When</th>
                  <th className="ws-th ws-th--location">Location</th>
                  <th className="ws-th ws-th--seats">Seats &amp; Status</th>
                  <th className="ws-th ws-th--actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((w) => {
                  const pct = w.capacity > 0 ? Math.round((w.activeCount / w.capacity) * 100) : 0;
                  const isFull = w.seatsAvailable === 0 && w.status === 'scheduled';
                  const isCompleted = w.status === 'completed';
                  const isCancelled = w.status === 'cancelled';
                  const initials = getInitials(w.instructor);
                  const seatColor = pct >= 80 ? 'var(--color-error)' : pct >= 50 ? 'var(--color-tertiary)' : 'var(--color-secondary)';

                  return (
                    <tr key={w.id} className={`ws-tr${isCancelled ? ' ws-tr--cancelled' : ''}`}>
                      {/* Code */}
                      <td className={`ws-td ws-td--code${isCancelled || isCompleted ? ' ws-td--muted' : ''}`}>
                        {w.code}
                      </td>

                      {/* Title */}
                      <td className="ws-td">
                        <Link
                          to={`/workshops/${w.id}`}
                          className={`ws-workshop-link${isCancelled ? ' ws-workshop-link--strike' : ''}`}
                        >
                          {w.title}
                        </Link>
                        {isCancelled && w.description && (
                          <span className="ws-cancelled-note">
                            <span className="material-symbols-outlined">info</span>
                            {w.description}
                          </span>
                        )}
                      </td>

                      {/* Instructor */}
                      <td className="ws-td">
                        <div className="ws-instructor">
                          <div className={`ws-avatar-sm${isCancelled || isCompleted ? ' ws-avatar-sm--muted' : ''}`}>
                            {initials}
                          </div>
                          <div>
                            <div className={`ws-instructor-name${isCancelled || isCompleted ? ' ws-instructor-name--muted' : ''}`}>
                              {w.instructor || '—'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* When */}
                      <td className="ws-td">
                        <div className={`ws-when-date${isCancelled ? ' ws-when-date--muted' : ''}`}>
                          <span className={`material-symbols-outlined ws-when-icon${isCancelled ? ' ws-when-icon--cancelled' : isCompleted ? ' ws-when-icon--completed' : ' ws-when-icon--scheduled'}`}>
                            {isCancelled ? 'event_busy' : isCompleted ? 'check_circle' : 'schedule'}
                          </span>
                          <span>{fmtDate(w.startsAt)}</span>
                        </div>
                        <div className="ws-when-time">{fmtTime(w.startsAt)}</div>
                      </td>

                      {/* Location */}
                      <td className="ws-td">
                        <span className={`ws-location-pill${isCancelled ? ' ws-location-pill--muted' : ''}`}>
                          {!isCancelled && <span className="ws-location-dot" />}
                          {w.location || '—'}
                        </span>
                      </td>

                      {/* Seats & Status */}
                      <td className="ws-td">
                        {isCompleted ? (
                          <div className="ws-status-row">
                            <span className="ws-badge ws-badge--completed">
                              <span className="material-symbols-outlined">done</span>
                              Completed
                            </span>
                            <span className="ws-attended">{w.activeCount} attended</span>
                          </div>
                        ) : isCancelled ? (
                          <span className="ws-badge ws-badge--cancelled">
                            <span className="material-symbols-outlined">cancel</span>
                            Cancelled
                          </span>
                        ) : isFull ? (
                          <div className="ws-status-row">
                            <span className="ws-badge ws-badge--full">Full (0 of {w.capacity})</span>
                            <span className="ws-badge ws-badge--scheduled">Scheduled</span>
                          </div>
                        ) : (
                          <div className="ws-seats-col">
                            <div className="ws-status-row">
                              <span className="ws-seats-count" style={{ color: seatColor }}>
                                {w.seatsAvailable} left of {w.capacity}
                              </span>
                              <span className="ws-badge ws-badge--scheduled">Scheduled</span>
                            </div>
                            <div className="ws-seats-bar-track">
                              <div className="ws-seats-bar" style={{ width: `${pct}%`, background: seatColor }} />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="ws-td ws-td--actions">
                        <Link to={`/workshops/${w.id}`} className={`ws-roster-link${isCancelled ? ' ws-roster-link--muted' : ''}`}>
                          <span>{isCancelled ? 'Audit' : isCompleted ? 'Summary' : 'Roster'}</span>
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="ws-pagination">
            <div className="ws-pagination-info">
              Showing <strong>{(data.page - 1) * 8 + 1}</strong> to{' '}
              <strong>{Math.min(data.page * 8, data.total)}</strong> of{' '}
              <strong>{data.total}</strong> workshops
              <span className="ws-pagination-page">• Page {data.page} of {data.pages}</span>
            </div>
            <div className="ws-pagination-controls">
              <button className="ws-page-btn" disabled={f.page <= 1} onClick={() => setF({ ...f, page: f.page - 1 })}>
                <span className="material-symbols-outlined">chevron_left</span>
                <span>Previous</span>
              </button>
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`ws-page-num${p === data.page ? ' ws-page-num--active' : ''}`} onClick={() => setF({ ...f, page: p })}>
                  {p}
                </button>
              ))}
              <button className="ws-page-btn" disabled={f.page >= data.pages} onClick={() => setF({ ...f, page: f.page + 1 })}>
                <span>Next</span>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Callout card ── */}
      <div className="ws-callout">
        <div className="ws-callout-left">
          <span className="material-symbols-outlined ws-callout-icon">help_center</span>
          <div>
            <h4 className="ws-callout-title">Front Desk Roster Notice</h4>
            <p className="ws-callout-desc">
              Participants arrive 15 minutes before studio opening. To process manual door walk-ins, ensure minimum safety buffers are maintained.
            </p>
          </div>
        </div>
        <div className="ws-callout-links">
          <a className="ws-callout-link" href="#">Download Attendance Sheet (PDF)</a>
          <span className="ws-callout-sep">•</span>
          <a className="ws-callout-link" href="#">Equipment Checklist</a>
        </div>
      </div>
    </>
  );
}
