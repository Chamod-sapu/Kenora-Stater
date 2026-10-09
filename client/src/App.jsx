import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Workshops from './pages/Workshops';
import WorkshopDetail from './pages/WorkshopDetail';
import Users from './pages/Users';
import ActivityLog from './pages/ActivityLog';
import Layout from './components/Layout';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from './AuthContext';

function Home() {
  const { user } = useAuth();
  return user.role === 'admin' ? <Navigate to="/users" replace /> : <Workshops />;
}

export default function App() {
  const desk = ['manager', 'staff'];
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Home />} />
        <Route path="/workshops/:id" element={<ProtectedRoute roles={desk}><WorkshopDetail /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
        <Route path="/audit-log" element={<ProtectedRoute roles={['admin', 'manager']}><ActivityLog /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}