import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { disasterTypeLabel } from '../../shared/disasterTypes.js';

const TOOLTIP_STYLE = {
  backgroundColor: '#21222D',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  fontSize: 12,
  color: '#FFFFFF'
};

export default function ReportChart({ reports }) {
  const counts = reports.reduce((acc, r) => {
    acc[r.disasterType] = (acc[r.disasterType] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([type, count]) => ({
    type: disasterTypeLabel(type),
    count
  }));

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">No data to chart yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#A0A0A0' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#A0A0A0' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="count" fill="#A9DFD8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

