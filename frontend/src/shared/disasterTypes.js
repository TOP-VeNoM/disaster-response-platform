// Kept in sync with backend/src/models/Report.js and SOP.js enum values.
// If you add a disaster type, update it in all three places.
export const DISASTER_TYPES = [
  { value: 'flood', label: 'Flood' },
  { value: 'fire', label: 'Fire' },
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'storm', label: 'Storm' },
  { value: 'medical', label: 'Medical Emergency' },
  { value: 'other', label: 'Other' }
];

export function disasterTypeLabel(value) {
  return DISASTER_TYPES.find((d) => d.value === value)?.label || value;
}
