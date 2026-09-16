import { DISASTER_TYPES } from '../../shared/disasterTypes.js';
import { URGENCY_LEVELS } from '../../shared/urgencyLevels.js';

const STATUSES = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'processing', label: 'Processing' },
  { value: 'awaiting_review', label: 'Awaiting Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'resolved', label: 'Resolved' }
];

// Deliberately not using the shared `.input` class here: that class sets
// `block w-full`, and a plain `w-auto` utility on the <select> can't
// reliably win against it (both compile into the same Tailwind layer, so
// whichever rule lands later in the generated stylesheet wins — not
// whichever looks more specific in the JSX). Building the select's classes
// from scratch avoids that collision entirely.
const SELECT_CLASS =
  'inline-block w-auto rounded-md border border-surface-border bg-surface-tile px-3 py-2 text-sm text-text-primary focus:border-accent-mint focus:outline-none focus:ring-1 focus:ring-accent-mint';

export default function ReportFilters({ filters, onChange }) {
  function update(key, value) {
    onChange({ ...filters, [key]: value || undefined });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select className={SELECT_CLASS} value={filters.disasterType || ''} onChange={(e) => update('disasterType', e.target.value)}>
        <option value="">All disaster types</option>
        {DISASTER_TYPES.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>

      <select className={SELECT_CLASS} value={filters.urgency || ''} onChange={(e) => update('urgency', e.target.value)}>
        <option value="">All urgencies</option>
        {URGENCY_LEVELS.map((u) => (
          <option key={u.value} value={u.value}>
            {u.label}
          </option>
        ))}
      </select>

      <select className={SELECT_CLASS} value={filters.status || ''} onChange={(e) => update('status', e.target.value)}>
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

