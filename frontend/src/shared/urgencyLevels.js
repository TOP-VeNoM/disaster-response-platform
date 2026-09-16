// Kept in sync with backend/src/models/Report.js enum values.
export const URGENCY_LEVELS = [
  { value: 'low', label: 'Low', color: '#16a34a' },
  { value: 'medium', label: 'Medium', color: '#ca8a04' },
  { value: 'high', label: 'High', color: '#ea580c' },
  { value: 'critical', label: 'Critical', color: '#dc2626' }
];

export function urgencyColor(value) {
  return URGENCY_LEVELS.find((u) => u.value === value)?.color || '#6b7280';
}

export function urgencyLabel(value) {
  return URGENCY_LEVELS.find((u) => u.value === value)?.label || 'Unclassified';
}
