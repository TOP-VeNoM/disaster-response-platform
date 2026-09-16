import { Link } from 'react-router-dom';
import { statusLabel, statusColor, formatRelativeTime } from '../../utils/formatters';
import { disasterTypeLabel } from '../../shared/disasterTypes.js';

export default function RecentActivity({ reports }) {
  const recent = reports.slice(0, 6);

  if (recent.length === 0) {
    return <p className="py-6 text-center text-sm text-text-muted">No recent activity.</p>;
  }

  return (
    <ul className="divide-y divide-surface-border">
      {recent.map((r) => (
        <li key={r._id} className="flex items-center justify-between py-3">
          <div>
            <Link to={`/reports/${r._id}`} className="text-xs font-medium text-text-primary hover:text-accent-mint">
              {disasterTypeLabel(r.disasterType)}: {r.description.slice(0, 50)}
              {r.description.length > 50 ? '...' : ''}
            </Link>
            <p className="text-[10px] text-text-muted">{formatRelativeTime(r.createdAt)}</p>
          </div>
          <span className={`badge shrink-0 ${statusColor(r.status)}`}>{statusLabel(r.status)}</span>
        </li>
      ))}
    </ul>
  );
}

