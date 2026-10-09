import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="nav">
        <strong>Training Centre</strong>
        {user.role !== 'admin' && <NavLink to="/" end>Workshops</NavLink>}
        {user.role === 'admin' && <NavLink to="/users">Users</NavLink>}
        <span className="spacer" />
        <span>{user.name} ({user.role})</span>
        <button onClick={logout}>Logout</button>
      </header>
      <main className="page"><Outlet /></main>
    </>
  );
}