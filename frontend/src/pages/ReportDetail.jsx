import { useParams, Link } from 'react-router-dom';
import { useAgentStream } from '../hooks/useAgentStream';
import ReportDetail from '../components/reports/ReportDetail.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

export default function ReportDetailPage() {
  const { id } = useParams();
  const { report, actions, error } = useAgentStream(id);

  if (error) return <p className="text-sm text-status-critical">{error}</p>;
  if (!report) return <LoadingSpinner label="Loading report..." />;

  return (
    <div>
      <Link to="/reports" className="text-sm text-accent-mint hover:underline">
        ← Back to reports
      </Link>
      <div className="mt-3">
        {report.status === 'processing' && (
          <div className="mb-4 rounded-md border border-accent-blue/40 bg-accent-blue/10 px-4 py-2 text-sm text-accent-blue">
            The agent is currently analyzing this report — this page refreshes automatically.
          </div>
        )}
        <ReportDetail report={report} actions={actions} />
      </div>
    </div>
  );
}
