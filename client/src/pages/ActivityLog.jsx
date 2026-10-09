import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

export default function ActivityLog() {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterActor, setFilterActor] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [exportState, setExportState] = useState('idle'); // idle, exporting, done

  const handleExport = () => {
    if (exportState !== 'idle') return;
    setExportState('exporting');
    setTimeout(() => {
      setExportState('done');
      setTimeout(() => {
        setExportState('idle');
      }, 2000);
    }, 900);
  };

  const handleQuickFilter = (target) => {
    if (target === 'security') setFilterAction('auth.login_failed');
    else if (target === 'workshops') setFilterAction('workshop.update');
    else if (target === 'staff') setFilterAction('user.update');
    else if (target === 'cancellations') setFilterAction('registration.cancel');
  };

  // We will keep all the rows in state/hardcoded for visual purposes
  const records = [
    {
      id: "EVT-90412",
      time: "10 mins ago",
      date: "14 May 2025, 11:24 AM",
      actorId: "CP",
      actorName: "Chaminda Perera",
      actorRole: "Admin",
      actorBg: "bg-primary text-on-primary",
      actorBadge: "bg-primary-fixed text-on-primary-fixed",
      actionCode: "workshop.update",
      actionCodeBg: "bg-primary-fixed text-on-primary-fixed",
      actionDesc: "Capacity altered",
      targetIcon: "palette",
      targetIconColor: "text-primary",
      targetId: "POT-101",
      targetDesc: "Intro to Pottery Studio A",
      details: (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-on-surface">Capacity increased from <span className="line-through text-on-surface-variant font-semibold">20</span> to <span className="font-semibold text-secondary">25</span> (+5 seats unlocked)</span>
          </div>
          <div className="p-2 rounded bg-surface text-on-surface-variant font-body-sm text-body-sm flex items-center justify-between">
            <span className="font-mono text-[11px] text-secondary font-medium">delta: {'{'} max_seats: 20 -&gt; 25, waitlist_mode: "auto" {'}'}</span>
            <span className="text-[10px] font-semibold text-on-surface-variant">Studio 2A</span>
          </div>
        </div>
      )
    },
    {
      id: "EVT-90411",
      time: "24 mins ago",
      timeColor: "text-tertiary-container",
      timeDot: "bg-error",
      date: "14 May 2025, 11:10 AM",
      actorId: "SK",
      actorName: "Sanduni Kariyawasam",
      actorRole: "Front-Desk Staff",
      actorBg: "bg-surface-container-high text-primary",
      actorBadge: "bg-surface-container-high text-on-surface-variant",
      actionCode: "registration.cancel",
      actionCodeBg: "bg-error-container text-on-error-container",
      actionDesc: "Attendee withdrawal",
      targetIcon: "person_cancel",
      targetIconColor: "text-tertiary",
      targetId: "Nimali Jayasuriya",
      targetDesc: "REG-8921 (POT-101)",
      details: (
        <div className="flex flex-col gap-1">
          <p className="text-on-surface">Registration cancelled for attendee. Reason recorded: <span className="italic text-on-surface font-medium">"Medical emergency / unwell"</span>.</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-caps text-label-caps font-semibold">1 SEAT REOPENED</span>
            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-caps text-label-caps">REFUND TRIGGERED (LKR 4,500)</span>
          </div>
        </div>
      )
    },
    {
      id: "EVT-90409",
      time: "1 hour ago",
      timeColor: "text-on-surface",
      timeDot: "bg-outline",
      date: "14 May 2025, 10:20 AM",
      actorId: "CP",
      actorName: "Chaminda Perera",
      actorRole: "Admin",
      actorBg: "bg-primary text-on-primary",
      actorBadge: "bg-primary-fixed text-on-primary-fixed",
      actionCode: "user.update",
      actionCodeBg: "bg-surface-container-highest text-primary",
      actionDesc: "Access privilege",
      targetIcon: "manage_accounts",
      targetIconColor: "text-on-surface-variant",
      targetId: "Mahesh Senanayake",
      targetDesc: "USR-044 • m.senanayake@trainingcentre.lk",
      details: (
        <div className="flex flex-col gap-1">
          <p className="text-on-surface">Role updated from <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium font-label-md">Staff</span> to <span className="px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-semibold font-label-md">Manager</span>.</p>
          <span className="text-on-surface-variant text-body-sm">Granted permissions: [workshop_create, roster_export, override_waitlist]. MFA state remains enforced.</span>
        </div>
      )
    },
    {
      id: "EVT-90405",
      time: "2 hours ago",
      timeColor: "text-on-surface",
      date: "14 May 2025, 09:15 AM",
      actorId: "MS",
      actorName: "Mahesh Senanayake",
      actorRole: "Manager",
      actorBg: "bg-secondary-fixed text-on-secondary-fixed",
      actorBadge: "bg-secondary-container text-on-secondary-container",
      actionCode: "workshop.update",
      actionCodeBg: "bg-primary-fixed text-on-primary-fixed",
      actionDesc: "Session rescheduled",
      targetIcon: "schedule",
      targetIconColor: "text-primary",
      targetId: "FIT-090",
      targetDesc: "Ergonomic Safety in Craft Workshops",
      details: (
        <div className="flex flex-col gap-1">
          <p className="text-on-surface">Schedule adjusted due to facilitator request:</p>
          <div className="p-2 rounded bg-surface font-mono text-[11px] text-on-surface flex flex-col gap-0.5">
            <div><span className="text-error font-semibold">- Original:</span> 14 May 2025 • 02:00 PM - 04:00 PM</div>
            <div><span className="text-secondary font-semibold">+ New Time:</span> 15 May 2025 • 10:00 AM - 12:00 PM</div>
          </div>
          <span className="text-[11px] text-on-surface-variant">Automated SMS/Email notification sent to 18 enrolled participants.</span>
        </div>
      )
    },
    {
      id: "EVT-90401",
      time: "3 hours ago",
      timeColor: "text-secondary",
      date: "14 May 2025, 08:34 AM",
      actorId: "SK",
      actorName: "Sanduni Kariyawasam",
      actorRole: "Front-Desk Staff",
      actorBg: "bg-surface-container-high text-primary",
      actorBadge: "bg-surface-container-high text-on-surface-variant",
      actionCode: "registration.create",
      actionCodeBg: "bg-secondary-container text-on-secondary-container",
      actionDesc: "Walk-in booking",
      targetIcon: "how_to_reg",
      targetIconColor: "text-secondary",
      targetId: "Samantha Wijesinghe",
      targetDesc: "REG-8922 • intro-pottery",
      details: (
        <div className="flex flex-col gap-1">
          <p className="text-on-surface">Registered attendee for <span className="font-semibold">POT-101 (Intro to Pottery)</span>.</p>
          <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
            <span>Payment: Paid Cash at Front Counter (Receipt #REC-4109)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span className="text-secondary font-medium">Confirmed</span>
          </div>
        </div>
      )
    },
    {
      id: "EVT-90398",
      time: "4 hours ago",
      timeColor: "text-error",
      timeIcon: "gpp_maybe",
      date: "14 May 2025, 07:42 AM",
      actorId: "SYS",
      actorName: "Security Daemon",
      actorRole: "Automated Shield",
      actorBg: "bg-error text-on-error",
      actorBadge: "bg-error-container text-on-error-container",
      actionCode: "auth.login_failed",
      actionCodeBg: "bg-tertiary-container text-on-tertiary",
      actionDesc: "3 attempts tripped",
      actionDescColor: "text-error",
      targetIcon: "lock_clock",
      targetIconColor: "text-error",
      targetId: "nimal.p@trainingcentre.lk",
      targetDesc: "Account ID: USR-038",
      rowClass: "bg-error-container/20",
      details: (
        <div className="flex flex-col gap-1">
          <p className="text-on-surface">3 consecutive failed password attempts from IP <code className="font-mono bg-surface-container px-1 py-0.5 rounded text-on-surface font-semibold">192.168.1.42</code> (Local Staff WiFi subnet).</p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-caps text-label-caps font-bold">TEMPORARY 15-MIN LOCK ENGAGED</span>
          </div>
        </div>
      )
    },
    {
      id: "EVT-90380",
      time: "Yesterday",
      timeColor: "text-on-surface",
      date: "13 May 2025, 04:55 PM",
      actorId: "CP",
      actorName: "Chaminda Perera",
      actorRole: "Admin",
      actorBg: "bg-primary text-on-primary",
      actorBadge: "bg-primary-fixed text-on-primary-fixed",
      actionCode: "user.update",
      actionCodeBg: "bg-error-container text-on-error-container",
      actionDesc: "Status deactivated",
      targetIcon: "person_off",
      targetIconColor: "text-tertiary",
      targetId: "Nimal Pathirana",
      targetDesc: "Former Assistant Instructor",
      details: (
        <div className="flex flex-col gap-1">
          <p className="text-on-surface">Account deactivated &amp; active session tokens invalidated. Access revoked per contract conclusion.</p>
          <span className="text-body-sm text-on-surface-variant font-mono text-[11px]">status: "active" -&gt; "disabled", badge_rfid: "revoked"</span>
        </div>
      )
    },
    {
      id: "EVT-90372",
      time: "Yesterday",
      timeColor: "text-on-surface",
      date: "13 May 2025, 02:18 PM",
      actorId: "MS",
      actorName: "Mahesh Senanayake",
      actorRole: "Manager",
      actorBg: "bg-secondary-fixed text-on-secondary-fixed",
      actorBadge: "bg-secondary-container text-on-secondary-container",
      actionCode: "workshop.create",
      actionCodeBg: "bg-secondary-container text-on-secondary-container",
      actionDesc: "New catalog item",
      targetIcon: "add_circle",
      targetIconColor: "text-primary",
      targetId: "POT-102",
      targetDesc: "Advanced Wheel Throwing",
      details: (
        <div className="flex flex-col gap-1">
          <p className="text-on-surface">Created new masterclass: <span className="font-semibold">POT-102: Advanced Wheel Throwing</span> in Studio 2B.</p>
          <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
            <span>Lead: Kasun Fernando</span>
            <span>•</span>
            <span>Capacity: 12 students</span>
            <span>•</span>
            <span>Fee: LKR 6,200</span>
          </div>
        </div>
      )
    },
    {
      id: "EVT-90355",
      time: "2 days ago",
      timeColor: "text-on-surface",
      date: "12 May 2025, 11:05 AM",
      actorId: "CP",
      actorName: "Chaminda Perera",
      actorRole: "Admin",
      actorBg: "bg-primary text-on-primary",
      actorBadge: "bg-primary-fixed text-on-primary-fixed",
      actionCode: "user.create",
      actionCodeBg: "bg-primary-fixed text-on-primary-fixed",
      actionDesc: "Staff onboarded",
      targetIcon: "person_add",
      targetIconColor: "text-primary",
      targetId: "Dilani Wickramasinghe",
      targetDesc: "d.wickramasinghe@tc.lk",
      details: (
        <div className="flex flex-col gap-1">
          <p className="text-on-surface">Provisioned staff profile with role <span className="font-semibold text-primary">Front-Desk Coordinator</span>. One-time welcome password link dispatched with 24-hr TTL.</p>
        </div>
      )
    },
    {
      id: "EVT-90310",
      time: "3 days ago",
      timeColor: "text-tertiary",
      date: "11 May 2025, 03:40 PM",
      actorId: "CP",
      actorName: "Chaminda Perera",
      actorRole: "Admin",
      actorBg: "bg-primary text-on-primary",
      actorBadge: "bg-primary-fixed text-on-primary-fixed",
      actionCode: "workshop.cancel",
      actionCodeBg: "bg-error-container text-on-error-container",
      actionDesc: "Session called off",
      targetIcon: "event_busy",
      targetIconColor: "text-tertiary",
      targetId: "OUT-014",
      targetDesc: "Open Air Botanical Sketching",
      details: (
        <div className="flex flex-col gap-1">
          <p className="text-on-surface">Emergency cancellation invoked due to heavy monsoon rain advisory. 14 registrants automatically notified and refunded in full.</p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-caps text-label-caps">INCLEMENT WEATHER PROTOCOL</span>
          </div>
        </div>
      )
    }
  ];

  const filteredRecords = records.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || r.actorName.toLowerCase().includes(q) || r.targetId.toLowerCase().includes(q) || r.targetDesc.toLowerCase().includes(q);
    const matchesAction = filterAction === 'all' || r.actionCode.toLowerCase() === filterAction.toLowerCase();
    const matchesActor = filterActor === 'all' || r.actorName.toLowerCase().includes(filterActor.toLowerCase());
    return matchesSearch && matchesAction && matchesActor;
  });

  return (
    <div className="flex flex-col w-full">
      {/* Operational Sub-Nav Header */}
      <div className="w-full bg-surface-container-lowest shadow-sm mb-space-lg">
        <div className="max-w-[1440px] mx-auto px-margin-lg py-space-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-xs overflow-x-auto py-1">
            <NavLink to="/workshops" className="px-space-md py-space-xs rounded-xl font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[18px]">brush</span>
              <span>Workshops</span>
            </NavLink>
            <NavLink to="/users" className="px-space-md py-space-xs rounded-xl font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <span>Staff Accounts</span>
            </NavLink>
            <NavLink to="/audit-log" className="px-space-md py-space-xs rounded-xl font-label-md text-label-md bg-primary text-on-primary shadow-sm flex items-center gap-space-xs font-semibold">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>manage_history</span>
              <span>Activity Log</span>
              <span className="ml-1 px-1.5 py-0.2 bg-on-primary/20 text-on-primary rounded text-[10px] font-bold">LIVE</span>
            </NavLink>
          </div>
          <div className="flex items-center gap-space-sm self-end sm:self-auto text-on-surface-variant">
            <div className="flex items-center gap-1.5 px-space-sm py-1 bg-surface-container-low rounded-lg text-primary font-label-caps text-label-caps">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span>SYNCED TO CLOUD LEDGER</span>
            </div>
            <span className="text-outline-variant">•</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Retention: 365 Days</span>
          </div>
        </div>
      </div>

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
              <span className="px-space-sm py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
                Tamper-Evident SHA-256
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Comprehensive audit trail of operational changes, workshop updates, attendee registrations, and staff access modifications across Colombo Central Studio.
            </p>
          </div>
          <div className="flex items-center gap-space-sm flex-wrap shrink-0">
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
              <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] pointer-events-none">search</span>
              <input 
                className="w-full h-10 pl-10 pr-space-md rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none transition-all placeholder:text-on-surface-variant/70 shadow-sm" 
                placeholder="Search by actor, target ID, or keyword..." 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Action Type Filter */}
            <div className="lg:col-span-3">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px] pointer-events-none">category</span>
                <select 
                  className="w-full h-10 pl-9 pr-8 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none transition-all appearance-none cursor-pointer shadow-sm"
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
                <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px] pointer-events-none">calendar_today</span>
                <select className="w-full h-10 pl-9 pr-8 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none transition-all appearance-none cursor-pointer shadow-sm">
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
                <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[18px] pointer-events-none">person_search</span>
                <select 
                  className="w-full h-10 pl-9 pr-8 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none transition-all appearance-none cursor-pointer shadow-sm"
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
                      <button onClick={() => setModalOpen(true)} className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors ml-auto" title="View Full Event Payload JSON">
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
                Showing <strong className="text-on-surface font-semibold">1</strong> to <strong className="text-on-surface font-semibold">{Math.min(10, filteredRecords.length)}</strong> of <strong className="text-on-surface font-semibold">148</strong> audit log records
              </span>
            </div>
            <div className="flex items-center gap-space-sm">
              <button className="px-space-md h-9 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors shadow-sm font-label-md text-label-md disabled:opacity-50 flex items-center gap-1" disabled>
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span>Previous</span>
              </button>
              <div className="flex items-center gap-1">
                <span className="px-3 h-9 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center shadow-sm">1</span>
                <span className="px-3 h-9 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center justify-center hover:bg-surface-container cursor-pointer transition-colors shadow-sm">2</span>
                <span className="px-3 h-9 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center justify-center hover:bg-surface-container cursor-pointer transition-colors shadow-sm">3</span>
                <span className="text-on-surface-variant px-1 font-body-sm text-body-sm">...</span>
                <span className="px-3 h-9 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center justify-center hover:bg-surface-container cursor-pointer transition-colors shadow-sm">15</span>
              </div>
              <button className="px-space-md h-9 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors shadow-sm font-label-md text-label-md flex items-center gap-1">
                <span>Next</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Compliance Callout Banner */}
        <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md shadow-sm">
          <div className="flex items-start gap-space-md">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">policy</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-lg text-label-lg font-semibold text-on-surface">Civic Operations Audit Compliance Note</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Audit records are strictly immutable and retained for exactly 365 calendar days in accordance with the Civic Workshop Management System security mandate (SL-DPA Act Compliance). Entries cannot be manually amended or wiped by system administrators.
              </p>
            </div>
          </div>
          <button className="px-space-md py-2 rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-container-high transition-colors font-label-md text-label-md font-semibold whitespace-nowrap shadow-sm">
            View Data Governance Policy
          </button>
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
                  <span>Event Hash: 5f4dcc3b5aa765d61d8327deb882cf99</span>
                  <span className="text-secondary font-bold">VERIFIED AUTHENTIC</span>
                </div>
                <pre className="bg-inverse-surface text-inverse-on-surface p-space-md rounded-lg font-mono text-[12px] leading-relaxed overflow-x-auto">
{`{
  "event_id": "EVT-90412",
  "timestamp": "2025-05-14T11:24:08.312Z",
  "actor": {
    "id": "USR-001",
    "name": "Chaminda Perera",
    "role": "ADMIN",
    "ip_address": "192.168.1.15",
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
  },
  "action": "workshop.update",
  "target": {
    "type": "WORKSHOP",
    "id": "POT-101",
    "title": "Intro to Pottery Studio A"
  },
  "diff": {
    "capacity": { "previous": 20, "new": 25 },
    "seats_remaining": { "previous": 0, "new": 5 },
    "waitlist_dispatched": false
  },
  "status": "SUCCESS"
}`}
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
