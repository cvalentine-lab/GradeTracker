import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <nav style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '12px 16px' }}>
        <Link to="/" style={{ fontWeight: 600, color: '#1e293b' }}>Grade Tracker</Link>
      </nav>
      <main style={{ maxWidth: 896, margin: '0 auto', padding: 32 }}>
        <Outlet />
      </main>
    </div>
  );
}
