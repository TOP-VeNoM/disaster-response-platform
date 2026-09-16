import { stepLabel, formatDate } from '../../utils/formatters';

const STATUS_ICON = {
  started: '⏳',
  completed: '✅',
  failed: '❌'
};

export default function AgentTimeline({ actions }) {
  if (!actions || actions.length === 0) {
    return <p className="mt-2 text-sm text-text-muted">No agent activity yet.</p>;
  }

  return (
    <ol className="mt-3 space-y-3 border-l-2 border-surface-border pl-4">
      {actions.map((a) => (
        <li key={a._id} className="relative">
          <span className="absolute -left-[1.4rem] text-sm">{STATUS_ICON[a.status] || '•'}</span>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">{stepLabel(a.step)}</span>
            <span className="text-xs text-text-muted">{formatDate(a.createdAt)}</span>
          </div>
          {a.status === 'failed' && a.error && (
            <p className="mt-1 text-xs text-status-critical">{a.error}</p>
          )}
          {a.durationMs != null && (
            <p className="mt-0.5 text-xs text-text-muted">{a.durationMs}ms</p>
          )}
        </li>
      ))}
    </ol>
  );
}
