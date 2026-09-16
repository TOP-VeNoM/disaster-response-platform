import { useMemo } from 'react';
import { useReports } from '../hooks/useReports';
import StatsCards from '../components/dashboard/StatsCards.jsx';
import ReportChart from '../components/dashboard/ReportChart.jsx';
import RecentActivity from '../components/dashboard/RecentActivity.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

export default function Dashboard() {
  const { reports, loading, error } = useReports({ limit: 100 });

  const stats = useMemo(
    () => ({
      total: reports.length,
      awaitingReview: reports.filter((r) => r.status === 'awaiting_review').length,
      critical: reports.filter((r) => r.urgency === 'critical' || r.urgency === 'high').length,
      resolved: reports.filter((r) => r.status === 'resolved').length
    }),
    [reports]
  );

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (error) return <p className="text-sm text-status-critical">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-text-muted">Overview of emergency reports and agent activity.</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-semibold text-text-primary">Reports by Type</h2>
          <ReportChart reports={reports} />
        </div>
        <div className="card">
          <h2 className="mb-2 font-semibold text-text-primary">Recent Activity</h2>
          <RecentActivity reports={reports} />
        </div>
      </div>
    </div>
  );
}
