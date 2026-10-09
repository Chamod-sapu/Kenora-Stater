import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const loc = useLocation();

  const getInitials = (name) => name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '??';

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-lowest border-b border-outline-variant shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 max-w-7xl mx-auto px-margin md:px-margin-md lg:px-margin-lg flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-lg">
            <div className="flex items-center gap-space-sm">
              <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[20px]">{user.role === 'admin' ? 'admin_panel_settings' : 'handyman'}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight leading-none">Training Centre</span>
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider mt-space-xs">
                  {user.role === 'admin' ? 'ADMIN PORTAL' : 'Community Workshop Management'}
                </span>
              </div>
            </div>
            
            <div className="h-6 w-px bg-outline-variant hidden md:block" />
            
            <nav className="hidden lg:flex items-center gap-space-xs">
              {user.role !== 'admin' && (
                <NavLink 
                  to="/" 
                  end
                  className={({ isActive }) => `px-space-md py-space-sm font-label-lg text-label-lg rounded-xl transition-colors ${isActive ? 'bg-primary-container text-on-primary shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'}`}
                >
                  Workshops
                </NavLink>
              )}
              {user.role === 'admin' && (
                <NavLink 
                  to="/users"
                  className={({ isActive }) => `px-space-md py-space-sm font-label-lg text-label-lg rounded-xl transition-colors ${isActive ? 'bg-primary text-on-primary shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'}`}
                >
                  Users
                </NavLink>
              )}
              {user.role !== 'admin' && (
                <>
                  <button className="px-space-md py-space-sm font-label-lg text-label-lg rounded-xl text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors">Registrations</button>
                  <button className="px-space-md py-space-sm font-label-lg text-label-lg rounded-xl text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors">Instructors</button>
                  <button className="px-space-md py-space-sm font-label-lg text-label-lg rounded-xl text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors">Reports</button>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-space-md">
            {user.role !== 'admin' && (
              <>
                <button aria-label="Notifications" className="relative p-space-sm rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors" type="button">
                  <span className="material-symbols-outlined text-[20px]">notifications</span>
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-container ring-2 ring-surface-container-lowest" />
                </button>
                <div className="h-6 w-px bg-outline-variant hidden sm:block" />
              </>
            )}

            <div className="flex items-center gap-space-sm">
              <div className="flex items-center gap-space-sm pl-space-xs">
                <div className={`w-8 h-8 rounded-full ${user.role === 'admin' ? 'bg-primary' : 'bg-primary-container'} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined ${user.role === 'admin' ? 'text-on-primary' : 'text-on-primary-container'} text-[18px]`}>person</span>
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-label-lg text-label-lg text-on-surface leading-tight">{user.name}</span>
                    <span className={`px-space-xs py-0.5 rounded-DEFAULT ${user.role === 'admin' ? 'bg-surface-container-high text-primary font-bold' : 'bg-surface-container text-on-primary-fixed-variant'} font-label-caps text-label-caps uppercase`}>
                      {user.role}
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight">{user.email || 'Operations'}</span>
                </div>
              </div>
              
              <button 
                onClick={logout}
                className="ml-space-xs px-space-sm py-1.5 font-label-md text-label-md text-error hover:bg-error-container rounded-lg border border-error-container hover:border-error transition-colors flex items-center gap-space-xs"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full pt-16 bg-surface min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>

      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant py-space-lg">
        <div className="max-w-7xl mx-auto px-margin md:px-margin-md lg:px-margin-lg flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
            <span className="font-label-lg text-label-lg text-on-surface">Training Centre</span>
            <span>•</span>
            <span>{user.role === 'admin' ? 'Administration System' : 'Community Workshop Management Operations Portal'}</span>
          </div>
          <div className="flex items-center gap-space-lg font-body-sm text-body-sm text-on-surface-variant">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">© 2025 Training Centre</span>
            <span className="flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              Operational Systems Active <span className="ml-2 font-mono text-[10px]">v2.4.0-{user.role}</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}