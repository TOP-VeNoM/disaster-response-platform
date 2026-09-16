import { Link } from 'react-router-dom';
import { statusLabel, statusColor, formatRelativeTime } from '../../utils/formatters';
import { disasterTypeLabel } from '../../shared/disasterTypes.js';
import { urgencyLabel, urgencyColor } from '../../shared/urgencyLevels.js';

export default function ReportList({ reports }) {
  if (reports.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">No reports found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-surface-border">
      <table className="min-w-full divide-y divide-surface-border text-sm">
        <thead className="bg-surface-tile">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-text-muted">Description</th>
            <th className="px-4 py-2 text-left font-medium text-text-muted">Type</th>
            <th className="px-4 py-2 text-left font-medium text-text-muted">Urgency</th>
            <th className="px-4 py-2 text-left font-medium text-text-muted">Status</th>
            <th className="px-4 py-2 text-left font-medium text-text-muted">Reported</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border bg-surface-card">
          {reports.map((r) => (
            <tr key={r._id} className="hover:bg-surface-tile">
              <td className="px-4 py-3">
                <Link to={`/reports/${r._id}`} className="text-accent-mint hover:underline">
                  {r.description.length > 60 ? `${r.description.slice(0, 60)}...` : r.description}
                </Link>
              </td>
              <td className="px-4 py-3 text-text-secondary">{disasterTypeLabel(r.disasterType)}</td>
              <td className="px-4 py-3">
                {r.urgency ? (
                  <span
                    className="badge text-white"
                    style={{ backgroundColor: urgencyColor(r.urgency) }}
                  >
                    {urgencyLabel(r.urgency)}
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">Pending</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className={`badge ${statusColor(r.status)}`}>{statusLabel(r.status)}</span>
              </td>
              <td className="px-4 py-3 text-text-muted">{formatRelativeTime(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
