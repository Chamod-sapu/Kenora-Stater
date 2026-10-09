import { useEffect, useState, useMemo } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Staff' });
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const load = () => api.get('/users').then((r) => setUsers(r.data.users)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);

  const run = async (fn) => { setError(''); try { await fn(); load(); } catch (e) { setError(errMsg(e)); } };
  const create = (e) => {
    e.preventDefault();
    run(async () => { await api.post('/users', { ...form, role: form.role.toLowerCase() }); setForm({ ...form, name: '', email: '', password: '' }); });
  };
  const patch = (id, body) => run(() => api.patch(`/users/${id}`, body));

  const generatePass = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#%';
    let result = 'TC@';
    for (let i = 0; i < 7; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm({ ...form, password: result });
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const roleMapped = u.role === 'admin' ? 'Administrator' : u.role === 'manager' ? 'Manager' : 'Staff';
      const matchRole = roleFilter === 'ALL' || roleMapped === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const activeCount = users.filter(u => u.isActive).length;
  const deactivatedCount = users.length - activeCount;

  return (
    <div className="max-w-[1440px] mx-auto px-margin-lg py-space-xl">
      <div className="flex flex-col w-full">
        {/* Informative Banner */}
        <div className="mb-space-lg rounded-xl bg-surface-container-low px-space-md py-space-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <p className="font-body-md text-body-md text-primary">
              <strong className="font-label-lg text-label-lg">Administrator Access</strong> • You are managing internal system credentials across Lakeside, City Centre, and North Centre locations.
            </p>
          </div>
          <span className="hidden md:inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-primary/10 text-primary font-label-caps text-label-caps tracking-wider uppercase">
            Security Tier 1
          </span>
        </div>

        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
          <div>
            <div className="flex items-center gap-space-sm">
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Staff accounts</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-label-md font-semibold">{users.length} Total</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-2xl">
              Manage staff access credentials, assign operational roles, and activate or deactivate user accounts.
            </p>
          </div>
          
          {/* Live System Overview Metric Pill */}
          <div className="flex items-center gap-space-lg bg-surface-container-lowest px-space-md py-2.5 rounded-xl shadow-sm self-start md:self-auto">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
              <span className="font-label-md text-label-md text-on-surface font-medium">{activeCount} Active</span>
            </div>
            <div className="h-4 w-px bg-surface-container-high"></div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
              <span className="font-label-md text-label-md text-on-surface-variant">{deactivatedCount} Suspended</span>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-error-container text-on-error-container font-body-md">{error}</div>}

        {/* Main Section 1: Create User Card */}
        <section className="mb-space-xl">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
            <div className="flex items-center justify-between pb-space-md mb-space-lg">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                </div>
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Add new staff account</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Issue temporary login credentials. The user will be prompted to set a permanent password upon first login.
                  </p>
                </div>
              </div>
              <span className="hidden lg:flex items-center gap-1 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">lock_reset</span> Auto-expiring tokens
              </span>
            </div>

            <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-md items-end">
              {/* Full Name */}
              <div className="lg:col-span-3 flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface font-medium">Full Name <span className="text-error">*</span></label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">badge</span>
                  <input 
                    type="text" placeholder="e.g., Kaveesha Perera" required
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                  />
                </div>
              </div>
              {/* Email Address */}
              <div className="lg:col-span-3 flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface font-medium">Email address <span className="text-error">*</span></label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">mail</span>
                  <input 
                    type="email" placeholder="kaveesha.p@trainingcentre.lk" required
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                  />
                </div>
              </div>
              {/* Temporary Password */}
              <div className="lg:col-span-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md text-on-surface font-medium">Temporary password <span className="text-error">*</span></label>
                  <button type="button" onClick={generatePass} className="font-label-md text-label-md text-primary hover:underline">Generate</button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">key</span>
                  <input 
                    type="text" placeholder="TempPass@2025" required minLength="8"
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full h-10 pl-9 pr-9 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono" 
                  />
                  <button type="button" onClick={() => navigator.clipboard.writeText(form.password)} className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface" title="Copy password">
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                  </button>
                </div>
              </div>
              {/* Role Select */}
              <div className="lg:col-span-2 flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface font-medium">Role <span className="text-error">*</span></label>
                <div className="relative">
                  <select 
                    value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full h-10 pl-3 pr-8 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
                  >
                    <option value="Staff">Staff (Front Desk)</option>
                    <option value="Manager">Manager (Operations)</option>
                    <option value="Administrator">Administrator (System Admin)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-outline pointer-events-none text-[20px]">expand_more</span>
                </div>
              </div>
              {/* Submit Button */}
              <div className="lg:col-span-1">
                <button type="submit" className="w-full h-10 px-space-md rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-medium shadow-sm hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 whitespace-nowrap">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>Create</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Main Section 2: User Management Table */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Table Controls Header */}
          <div className="p-space-lg flex flex-col sm:flex-row gap-space-md items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">search</span>
              <input 
                type="text" placeholder="Search staff by name or email..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-8 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-sm transition-all" 
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
            {/* Quick Filters & Export */}
            <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
              <label className="font-label-md text-label-md text-on-surface-variant font-medium hidden sm:inline">Role Filter:</label>
              <div className="relative">
                <select 
                  value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-10 pl-3 pr-8 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md appearance-none focus:outline-none cursor-pointer shadow-sm transition-all"
                >
                  <option value="ALL">All roles</option>
                  <option value="Staff">Staff</option>
                  <option value="Manager">Manager</option>
                  <option value="Administrator">Administrator</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-outline pointer-events-none text-[18px]">filter_list</span>
              </div>
              <button type="button" className="h-10 px-space-md rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center gap-1.5 shadow-sm" title="Download credential audit log">
                <span className="material-symbols-outlined text-[18px]">file_download</span>
                <span className="hidden md:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-outline font-label-caps text-label-caps uppercase tracking-wider">
                  <th className="py-3 px-space-lg font-semibold">Name &amp; Operational Role</th>
                  <th className="py-3 px-space-md font-semibold">Email address</th>
                  <th className="py-3 px-space-md font-semibold w-48">Assigned Role</th>
                  <th className="py-3 px-space-md font-semibold w-36">Status</th>
                  <th className="py-3 px-space-lg font-semibold text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low font-body-md text-body-md">
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-8 text-on-surface-variant">No staff matching filters</td></tr>
                ) : filteredUsers.map(u => {
                  const isMe = u.id === me.id;
                  const roleDisplay = u.role === 'admin' ? 'Administrator' : u.role === 'manager' ? 'Manager' : 'Staff';
                  const roleSub = u.role === 'admin' ? 'Primary Operations Administrator' : u.role === 'manager' ? 'Operations Lead • All Hubs' : 'Front Desk Officer';

                  return (
                    <tr key={u.id} className={`transition-colors group ${!u.isActive ? 'bg-surface-container-low/40 hover:bg-surface-container-low/70 opacity-80' : 'hover:bg-surface-container-low/50'}`}>
                      <td className="py-3.5 px-space-lg">
                        <div className="flex items-center gap-space-md">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-label-lg text-label-lg font-bold shadow-sm ${isMe ? 'bg-primary text-on-primary ring-2 ring-primary/20' : !u.isActive ? 'bg-surface-container text-outline shadow-none' : 'bg-surface-container-high text-primary'}`}>
                            {getInitials(u.name)}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={`font-headline-sm text-[15px] font-semibold ${!u.isActive ? 'text-outline line-through' : 'text-on-surface'}`}>{u.name}</span>
                              {isMe && <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-label-caps text-label-caps font-bold tracking-wide">YOU</span>}
                              {!u.isActive && <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-caps text-[10px] tracking-wide">REVOKED</span>}
                            </div>
                            <span className={`font-body-sm text-body-sm flex items-center gap-1 ${!u.isActive ? 'text-outline' : 'text-on-surface-variant'}`}>
                              {!u.isActive ? `Access suspended on ${new Date(u.cancelledAt || u.updatedAt || Date.now()).toLocaleDateString()}` : (
                                <>
                                  {isMe && <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>}
                                  {roleSub}
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className={`py-3.5 px-space-md font-body-sm ${!u.isActive ? 'text-outline line-through' : 'text-on-surface-variant'}`}>
                        {u.email}
                      </td>
                      <td className="py-3.5 px-space-md">
                        <div className="relative w-44">
                          {isMe || !u.isActive ? (
                            <div className={`h-9 px-3 rounded-xl flex items-center justify-between font-label-md text-label-md cursor-not-allowed ${!u.isActive ? 'bg-surface-container text-outline shadow-none' : 'bg-surface-container text-on-surface-variant shadow-none'}`}>
                              <span className="flex items-center gap-1.5 font-medium">
                                {isMe && <span className="material-symbols-outlined text-[16px] text-outline">shield</span>}
                                {roleDisplay}
                              </span>
                              <span className={`material-symbols-outlined text-[16px] ${!u.isActive ? 'text-outline/50' : 'text-outline'}`} title="Role locked">lock</span>
                            </div>
                          ) : (
                            <>
                              <select 
                                value={roleDisplay} onChange={(e) => patch(u.id, { role: e.target.value.toLowerCase() })}
                                className="w-full h-9 pl-3 pr-8 rounded-xl bg-surface-container-lowest text-on-surface font-label-md text-label-md appearance-none shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
                              >
                                <option value="Staff">Staff</option>
                                <option value="Manager">Manager</option>
                                <option value="Administrator">Administrator</option>
                              </select>
                              <span className="material-symbols-outlined absolute right-2 top-2 text-outline pointer-events-none text-[18px]">unfold_more</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-space-md">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-md text-label-md font-semibold">
                            <span className="w-2 h-2 rounded-full bg-secondary"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-md text-label-md font-semibold">
                            <span className="w-2 h-2 rounded-full bg-error"></span> Deactivated
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-space-lg text-right">
                        {isMe ? (
                          <div className="inline-flex items-center" title="Cannot deactivate self">
                            <button disabled className="h-8 px-space-md rounded-xl bg-surface-container text-outline font-label-md text-label-md font-medium cursor-not-allowed opacity-60 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">block</span> Deactivate
                            </button>
                          </div>
                        ) : u.isActive ? (
                          <button onClick={() => patch(u.id, { isActive: false })} className="h-8 px-space-md rounded-xl bg-error-container text-on-error-container hover:bg-tertiary-container hover:text-on-tertiary transition-colors font-label-md text-label-md font-medium inline-flex items-center gap-1 shadow-sm">
                            <span className="material-symbols-outlined text-[16px]">person_off</span> Deactivate
                          </button>
                        ) : (
                          <button onClick={() => patch(u.id, { isActive: true })} className="h-8 px-space-md rounded-xl bg-secondary text-on-secondary hover:bg-on-secondary-container transition-colors font-label-md text-label-md font-semibold inline-flex items-center gap-1 shadow-sm">
                            <span className="material-symbols-outlined text-[16px]">lock_open</span> Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Advisory and Summary Bar */}
          <div className="p-space-md md:px-space-lg bg-surface-container-low/60 flex flex-col md:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
            <div className="flex items-center gap-space-xs font-medium text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-primary">groups</span>
              <span>Showing {filteredUsers.length} staff accounts • <span className="text-secondary font-semibold">{activeCount} active</span>, <span className="text-error font-semibold">{deactivatedCount} deactivated</span></span>
            </div>
            <div className="flex items-center gap-space-xs text-on-surface-variant text-[13px]">
              <span className="material-symbols-outlined text-[16px] text-outline">info</span>
              <span>Deactivated accounts immediately revoke portal and front-desk login access. Audit logs are preserved.</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}