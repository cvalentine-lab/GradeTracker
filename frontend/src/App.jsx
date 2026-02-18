import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Grades from './pages/Grades';
import Syllabi from './pages/Syllabi';
import Planner from './pages/Planner';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="/syllabi" element={<Syllabi />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
