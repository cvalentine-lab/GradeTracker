import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <nav style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: 896,
        margin: '0 auto',
      }}>
        <Link to="/" style={{ fontWeight: 600, color: '#1e293b', textDecoration: 'none' }}>
          Grade Tracker
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: '#64748b' }}>{user?.email}</span>
          <button
            onClick={handleLogout}
            style={{
              fontSize: 14,
              color: '#64748b',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </nav>
      <main style={{ maxWidth: 896, margin: '0 auto', padding: 32 }}>
        <Outlet />
      </main>
    </div>
  );
}
