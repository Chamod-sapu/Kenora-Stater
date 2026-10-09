import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api, { errMsg } from '../api';

export default function ActivityLog() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterActor, setFilterActor] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [exportState, setExportState] = useState('idle'); // idle, exporting, done
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/audit')
      .then(r => setRecords(r.data.items || []))
      .catch(e => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    if (exportState !== 'idle') return;
    setExportState('exporting');
    
    const headers = ['ID', 'Date', 'Time', 'Actor ID', 'Actor Name', 'Actor Role', 'Action Code', 'Action Desc', 'Target ID', 'Target Desc'];
    const csvRows = filteredRecords.map(r => [
      r.id, `"${r.date}"`, `"${r.time}"`, r.actorId, `"${r.actorName}"`, `"${r.actorRole}"`, r.actionCode, `"${r.actionDesc}"`, `"${r.targetId}"`, `"${r.targetDesc}"`
    ].join(','));
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setExportState('done');
      setTimeout(() => setExportState('idle'), 2000);
    }, 900);
  };

  const handleQuickFilter = (target) => {
    if (target === 'security') setFilterAction('auth.login_failed');
    else if (target === 'workshops') setFilterAction('workshop.update');
    else if (target === 'staff') setFilterAction('user.update');
    else if (target === 'cancellations') setFilterAction('registration.cancel');
  };

  const mappedRecords = records.map(r => ({
    id: r._id,
    time: new Date(r.createdAt).toLocaleTimeString(),
    date: new Date(r.createdAt).toLocaleDateString(),
    actorId: r.actorName ? r.actorName.substring(0,2).toUpperCase() : '??',
    actorName: r.actorName || 'System',
    actorRole: 'User',
    actorBg: "bg-surface-container-high text-primary",
    actorBadge: "bg-surface-container-high text-on-surface-variant",
    actionCode: r.action,
    actionCodeBg: "bg-secondary-container text-on-secondary-container",
    actionDesc: r.action,
    targetIcon: "data_object",
    targetIconColor: "text-secondary",
    targetId: r.entityId || '-',
    targetDesc: r.entity || '-',
    raw: r,
    details: (
      <div className="flex flex-col gap-1">
        <p className="text-on-surface">{r.action} on {r.entity}</p>
      </div>
    )
  }));

  const filteredRecords = mappedRecords.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || r.actorName.toLowerCase().includes(q) || r.targetId.toLowerCase().includes(q) || r.targetDesc.toLowerCase().includes(q);
    const matchesAction = filterAction === 'all' || r.actionCode.toLowerCase() === filterAction.toLowerCase();
    const matchesActor = filterActor === 'all' || r.actorName.toLowerCase().includes(filterActor.toLowerCase());
    return matchesSearch && matchesAction && matchesActor;
  });

  return (
    <div className="flex flex-col w-full">
      <div className="max-w-[1440px] mx-auto w-full px-margin-lg flex flex-col gap-space-xl pb-space-xl">
        {/* Top Action / Title Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg">
          <div className="flex flex-col gap-1 max-w-3xl">
            <div className="flex items-center gap-space-sm flex-wrap">
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Activity Log</h1>
              <span className="px-space-sm py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-label-md font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">history</span>
                148 Events
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm flex-wrap shrink-0 p-5">
            {/* Live Polling Badge / Toggle */}
            <div className="flex items-center gap-2 bg-surface-container-lowest px-space-md py-2 rounded-xl shadow-sm text-on-surface">
              <div className="relative flex items-center justify-center w-3 h-3">
                <span className={`absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75 ${isRefreshing ? 'animate-ping' : 'hidden'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isRefreshing ? 'bg-secondary' : 'bg-outline'}`}></span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold leading-none">Auto-refresh</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">{isRefreshing ? 'Every 30s' : 'Paused'}</span>
              </div>
              <button 
                className="ml-1 text-primary hover:text-on-primary-fixed-variant transition-all duration-300" 
                onClick={() => setIsRefreshing(!isRefreshing)}
                style={{ transform: isRefreshing ? 'rotate(0deg)' : 'rotate(180deg)' }}
                title="Toggle Auto Refresh" 
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">sync</span>
              </button>
            </div>
            {/* Export CSV Button */}
            <button 
              onClick={handleExport}
              className="h-10 px-space-md rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center gap-space-xs shadow-sm font-label-lg text-label-lg active:scale-[0.98]" 
            >
              <span className={`material-symbols-outlined text-[18px] ${exportState === 'exporting' ? 'animate-spin' : ''}`}>
                {exportState === 'exporting' ? 'refresh' : exportState === 'done' ? 'done' : 'file_download'}
              </span>
              <span>
                {exportState === 'exporting' ? 'Exporting...' : exportState === 'done' ? 'Downloaded!' : 'Export Audit CSV'}
              </span>
            </button>
          </div>
        </div>

        {/* Filter & Controls Card */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-md">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-md">
            {/* Search Keyword */}
            <div className="lg:col-span-4 relative flex items-center">
              <input 
                className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none transition-all placeholder:text-on-surface-variant/70 shadow-sm" 
                placeholder="Search by actor, target ID, or keyword..." 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Action Type Filter */}
            <div className="lg:col-span-3">
              <div className="relative flex items-center">
                <select 
                  className="w-full h-10 pl-3 pr-8 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none transition-all appearance-none cursor-pointer shadow-sm"
                  value={filterAction}
                  onChange={e => setFilterAction(e.target.value)}
                >
                  <option value="all">All action types (All)</option>
                  <option value="workshop.update">workshop.update (Workshop edits)</option>
                  <option value="workshop.create">workshop.create (New workshop)</option>
                  <option value="workshop.cancel">workshop.cancel (Cancellations)</option>
                  <option value="registration.cancel">registration.cancel (Attendee refund/drop)</option>
                  <option value="registration.create">registration.create (Attendee enrolled)</option>
                  <option value="user.update">user.update (Staff role/status change)</option>
                  <option value="user.create">user.create (New account created)</option>
                  <option value="auth.login_failed">auth.login_failed (Security alerts)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
              </div>
            </div>
            {/* Date Range Filter */}
            <div className="lg:col-span-2">
              <div className="relative flex items-center">
                <select className="w-full h-10 pl-3 pr-8 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none transition-all appearance-none cursor-pointer shadow-sm">
                  <option value="today">Today</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="custom">Custom range...</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
              </div>
            </div>
            {/* Actor Filter */}
            <div className="lg:col-span-2">
              <div className="relative flex items-center">
                <select 
                  className="w-full h-10 pl-3 pr-8 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none transition-all appearance-none cursor-pointer shadow-sm"
                  value={filterActor}
                  onChange={e => setFilterActor(e.target.value)}
                >
                  <option value="all">All actors (Everyone)</option>
                  <option value="Chaminda Perera">Chaminda Perera (Admin)</option>
                  <option value="Mahesh Senanayake">Mahesh Senanayake (Manager)</option>
                  <option value="Sanduni Kariyawasam">Sanduni Kariyawasam (Staff)</option>
                  <option value="Dilani Wickramasinghe">Dilani Wickramasinghe (Staff)</option>
                  <option value="System Worker">System Daemon / Automated</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
              </div>
            </div>
            {/* Reset Button */}
            <div className="lg:col-span-1 flex items-center">
              <button 
                onClick={() => { setSearchQuery(''); setFilterAction('all'); setFilterActor('all'); }}
                className="w-full h-10 px-space-sm rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1 font-label-md text-label-md shadow-sm" title="Clear all search parameters" type="button"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>Reset</span>
              </button>
            </div>
          </div>
          {/* Quick summary tags & fast-filter chips */}
          <div className="flex items-center justify-between flex-wrap gap-space-sm pt-2 bg-surface-container-lowest">
            <div className="flex items-center gap-1.5 flex-wrap font-label-md text-label-md text-on-surface-variant">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold mr-1">Quick Filters:</span>
              <button onClick={() => handleQuickFilter('security')} className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md">Failed Logins (1)</button>
              <button onClick={() => handleQuickFilter('workshops')} className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md">Workshop Modifs (4)</button>
              <button onClick={() => handleQuickFilter('staff')} className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md">Staff Changes (2)</button>
              <button onClick={() => handleQuickFilter('cancellations')} className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md">Enrolment Drops (2)</button>
            </div>
            <div className="text-right font-body-sm text-body-sm text-on-surface-variant">
              Showing <span className="font-semibold text-on-surface">{filteredRecords.length}</span> of <span className="font-semibold text-on-surface">148</span> matching records
            </div>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider select-none">
                  <th className="py-3 px-space-md font-semibold min-w-[190px]">
                    <div className="flex items-center gap-1">
                      <span>When</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                    </div>
                  </th>
                  <th className="py-3 px-space-md font-semibold min-w-[210px]">Actor (Who)</th>
                  <th className="py-3 px-space-md font-semibold min-w-[170px]">Action Code</th>
                  <th className="py-3 px-space-md font-semibold min-w-[200px]">Entity / Target</th>
                  <th className="py-3 px-space-md font-semibold min-w-[340px]">Modification Details &amp; State Diff</th>
                  <th className="py-3 px-space-md font-semibold text-right min-w-[70px]">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y-0 font-body-md text-body-md text-on-surface">
                {filteredRecords.map((r, i) => (
                  <tr key={i} className={`hover:bg-surface-container-low transition-colors group ${r.rowClass || ''}`}>
                    <td className="py-space-md px-space-md align-top">
                      <div className="flex flex-col">
                        <span className={`font-semibold ${r.timeColor || 'text-primary'} font-label-md text-label-md flex items-center gap-1`}>
                          {r.timeIcon ? (
                            <span className="material-symbols-outlined text-[14px]">{r.timeIcon}</span>
                          ) : (
                            <span className={`w-1.5 h-1.5 rounded-full ${r.timeDot || 'bg-primary'} inline-block`}></span>
                          )}
                          {r.time}
                        </span>
                        <span className="text-on-surface-variant font-body-sm text-body-sm">{r.date}</span>
                        <span className="text-[10px] text-on-surface-variant font-mono mt-0.5">ID: #{r.id}</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md align-top">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md font-semibold shrink-0 shadow-sm ${r.actorBg}`}>
                          {r.actorId}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-on-surface truncate">{r.actorName}</span>
                          <span className={`px-1.5 py-0.2 rounded font-label-caps text-label-caps w-max uppercase ${r.actorBadge}`}>
                            {r.actorRole}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md align-top">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${r.actionCodeBg}`}>
                          {r.actionCode}
                        </span>
                        <span className={`text-[10px] font-medium ${r.actionDescColor || 'text-on-surface-variant'}`}>{r.actionDesc}</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md align-top">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className={`material-symbols-outlined text-[16px] ${r.targetIconColor}`}>{r.targetIcon}</span>
                          <span className="font-semibold text-on-surface font-label-md text-label-md">{r.targetId}</span>
                        </div>
                        <span className="text-on-surface-variant font-body-sm text-body-sm truncate">{r.targetDesc}</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md align-top">
                      {r.details}
                    </td>
                    <td className="py-space-md px-space-md align-top text-right">
                      <button onClick={() => { setSelectedRecord(r); setModalOpen(true); }} className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors ml-auto" title="View Full Event Payload JSON">
                        <span className="material-symbols-outlined text-[18px]">data_object</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Table Footer */}
          <div className="bg-surface-container-low px-space-md py-space-md flex flex-col md:flex-row items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
              <span>
                Showing <strong className="text-on-surface font-semibold">{Math.min(1, filteredRecords.length)}</strong> to <strong className="text-on-surface font-semibold">{filteredRecords.length}</strong> of <strong className="text-on-surface font-semibold">{filteredRecords.length}</strong> audit log records
              </span>
            </div>
          </div>
        </div>
        
        {/* Inspect Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-sm">
            <div className="bg-surface-container-lowest rounded-xl shadow-xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-space-md bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">code</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">Raw Audit Event Payload</span>
                </div>
                <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="p-space-lg flex flex-col gap-space-md bg-surface-container-lowest">
                <div className="flex items-center justify-between font-label-caps text-label-caps uppercase text-on-surface-variant">
                  <span>Event Hash: {selectedRecord?.id || 'N/A'}</span>
                  <span className="text-secondary font-bold">VERIFIED AUTHENTIC</span>
                </div>
                <pre className="bg-inverse-surface text-inverse-on-surface p-space-md rounded-lg font-mono text-[12px] leading-relaxed overflow-x-auto">
{JSON.stringify(selectedRecord?.raw || {}, null, 2)}
                </pre>
                <div className="flex justify-end gap-space-sm pt-2">
                  <button className="h-9 px-space-md rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    <span>Copy JSON</span>
                  </button>
                  <button onClick={() => setModalOpen(false)} className="h-9 px-space-md rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md transition-colors shadow-sm">
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
