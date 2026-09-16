import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './components/auth/Login.jsx';
import Register from './components/auth/Register.jsx';
import Layout from './components/layout/Layout.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import LoadingSpinner from './components/common/LoadingSpinner.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Reports from './pages/Reports.jsx';
import NewReport from './pages/NewReport.jsx';
import ReportDetailPage from './pages/ReportDetail.jsx';
import AgentDashboardPage from './pages/AgentDashboard.jsx';
import SOPs from './pages/SOPs.jsx';
import Analytics from './pages/Analytics.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner label="Loading..." />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function ResponderRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner label="Loading..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'responder' && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/new" element={<NewReport />} />
          <Route path="reports/:id" element={<ReportDetailPage />} />
          <Route
            path="agent"
            element={
              <ResponderRoute>
                <AgentDashboardPage />
              </ResponderRoute>
            }
          />
          <Route path="sops" element={<SOPs />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
