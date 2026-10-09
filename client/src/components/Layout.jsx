import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="bg-background font-body-md text-body-md text-on-surface antialiased min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 max-w-[1440px] mx-auto px-margin-lg flex items-center justify-between">
          <div className="flex items-center gap-space-xl">
            <div className="flex items-center gap-space-sm">
              <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[20px]">{isAdmin ? 'admin_panel_settings' : 'school'}</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
                {isAdmin ? 'Admin Console' : 'Training Centre'}
              </span>
            </div>
            
            {!isAdmin && (
              <nav className="hidden lg:flex items-center gap-space-sm">
                <NavLink 
                  to="/" 
                  end
                  className={({ isActive }) => `transition-all rounded-xl px-space-md py-space-sm font-label-lg text-label-lg ${isActive ? 'text-primary font-semibold bg-surface-container-low' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
                >
                  Workshops
                </NavLink>
                {user?.role === 'manager' && (
                  <NavLink 
                    to="/audit-log"
                    className={({ isActive }) => `transition-all rounded-xl px-space-md py-space-sm font-label-lg text-label-lg ${isActive ? 'text-primary font-semibold bg-surface-container-low' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
                  >
                    Activity Log
                  </NavLink>
                )}
              </nav>
            )}
            
            {/* If Admin needs top-level nav links, we can add them here, but the design specifies the sub-nav in the page itself for Admins. We can fall back to a hidden nav here just in case, but let's stick to the design. */}
          </div>

          <div className="flex items-center gap-space-lg">
            <div className="flex items-center gap-space-md">
              <div className="text-right hidden sm:block">
                <div className="font-label-lg text-label-lg text-on-surface font-semibold">{user?.name || 'User'}</div>
                <span className={`font-label-caps text-label-caps uppercase px-space-xs py-0.5 rounded ${isAdmin ? 'text-primary bg-primary-container' : 'text-secondary bg-surface-container'}`}>
                  {user?.role}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">{isAdmin ? 'shield' : 'person'}</span>
              </div>
            </div>
            <div className="h-6 w-px bg-surface-container-highest"></div>
            <a 
              href="#" 
              onClick={handleLogout}
              className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant hover:text-tertiary px-space-sm py-space-xs rounded-xl hover:bg-error-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Logout</span>
            </a>
          </div>
        </div>
      </header>

      <main className="w-full pt-16 flex-1 max-w-[1440px] mx-auto px-margin-lg py-space-xl">
        <Outlet />
      </main>

      <footer className="w-full bg-surface-container-lowest shadow-[0_-1px_6px_rgba(0,0,0,0.02)] py-space-md mt-auto">
        <div className="max-w-[1440px] mx-auto px-margin-lg flex flex-col sm:flex-row items-center justify-between gap-space-sm font-body-sm text-body-sm text-on-surface-variant">
          <div>© 2025 Training Centre Operations Management. All rights reserved.</div>
          <div className="flex items-center gap-space-md">
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              {isAdmin ? 'Admin Console v2.4' : 'Front-Desk Console v2.4'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}