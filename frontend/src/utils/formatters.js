export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '—';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export function statusLabel(status) {
  const labels = {
    submitted: 'Submitted',
    processing: 'Agent Processing',
    awaiting_review: 'Awaiting Review',
    approved: 'Approved',
    rejected: 'Rejected',
    resolved: 'Resolved'
  };
  return labels[status] || status;
}

export function statusColor(status) {
  const colors = {
    submitted: 'bg-white/10 text-text-secondary',
    processing: 'bg-accent-blue/15 text-accent-blue',
    awaiting_review: 'bg-status-medium/15 text-status-medium',
    approved: 'bg-status-low/15 text-status-low',
    rejected: 'bg-status-critical/15 text-status-critical',
    resolved: 'bg-accent-pink/15 text-accent-pink'
  };
  return colors[status] || 'bg-white/10 text-text-secondary';
}

export function stepLabel(step) {
  const labels = {
    parse: 'Parse Report',
    classify: 'Classify Urgency',
    retrieve_sops: 'Retrieve SOPs',
    call_tool: 'Gather Context',
    generate_plan: 'Generate Plan',
    human_review: 'Human Review'
  };
  return labels[step] || step;
}

export function formatDuration(ms) {
  if (ms == null || Number.isNaN(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(1)}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}
