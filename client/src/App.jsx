import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from './AuthContext';

function Home() {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: 24 }}>
      <h2>Hello, {user.name} ({user.role})</h2>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
    </Routes>
  );
}