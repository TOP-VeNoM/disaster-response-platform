import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { reportsApi } from '../services/api/reports';
import { urgencyLabel, urgencyColor } from '../shared/urgencyLevels.js';
import { disasterTypeLabel } from '../shared/disasterTypes.js';
import { statusLabel, formatDuration } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ReportsMap from '../components/dashboard/ReportsMap.jsx';
import { Clock, Gauge, Timer } from 'lucide-react';

// Shared across every chart on this page so colors stay consistent with the
// rest of the dark theme — these were previously hardcoded per-chart as
// light-theme hex values (#f0f0f0 grid, #2563eb line) left over from before
// the dark retheme; inline chart props aren't caught by a grep for Tailwind
// classes, which is how that slipped through the earlier pass.
const CHART_GRID = 'rgba(255,255,255,0.06)';
const CHART_AXIS = 'rgba(255,255,255,0.1)';
const CHART_TICK = { fontSize: 11, fill: '#A0A0A0' };
const TOOLTIP_STYLE = {
  backgroundColor: '#21222D',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  fontSize: 12,
  color: '#FFFFFF'
};
const DISASTER_COLORS = ['#A9DFD8', '#FEB95A', '#F2C8ED', '#28AEF3', '#FCB859', '#9ca3af'];
const STATUS_COLORS = ['#A9DFD8', '#7c3aed', '#28AEF3', '#16a34a', '#dc2626', '#ca8a04'];

function MetricTile({ icon: Icon, label, value, sublabel, accent }) {
  return (
    <div className="tile flex flex-col gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: `${accent}22` }}>
        <Icon size={14} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-lg font-semibold text-text-primary">{value}</p>
        <p className="text-[10px] text-text-secondary">{label}</p>
        {sublabel && <p className="mt-0.5 text-[10px] text-text-muted">{sublabel}</p>}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    reportsApi
      .getAnalytics()
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(err.response?.data?.error || err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingSpinner label="Crunching numbers..." />;
  if (error) return <p className="text-sm text-status-critical">{error}</p>;
  if (!data) return null;

  const totalReports = data.byStatus.reduce((s, r) => s + r.count, 0);

  const urgencyChartData = data.byUrgency.map((r) => ({
    name: r.urgency === 'unclassified' ? 'Unclassified' : urgencyLabel(r.urgency),
    value: r.count,
    color: r.urgency === 'unclassified' ? '#9ca3af' : urgencyColor(r.urgency)
  }));

  const statusChartData = data.byStatus.map((r) => ({ name: statusLabel(r.status), value: r.count }));

  const disasterTypeChartData = data.byDisasterType.map((r) => ({
    type: disasterTypeLabel(r.disasterType),
    count: r.count
  }));

  const volumeChartData = data.dailyVolume.map((r) => ({
    day: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    count: r.count
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Analytics</h1>
        <p className="mt-1 text-sm text-text-muted">
          Aggregate view across all {totalReports} reports in the system — computed server-side, not capped to a
          recent subset.
        </p>
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold text-text-primary">Report Locations</h2>
        <ReportsMap />
      </div>

      <div className="card">
        <p className="mb-1 text-sm font-semibold text-text-primary">Operational Metrics</p>
        <p className="mb-4 text-[10px] text-text-muted">How the agent and review process are actually performing</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <MetricTile
            icon={Timer}
            accent="#A9DFD8"
            label="Avg. Agent Pipeline Time"
            value={formatDuration(data.avgPipelineDurationMs)}
            sublabel="parse → plan generation"
          />
          <MetricTile
            icon={Clock}
            accent="#FEB95A"
            label="Avg. Time to Review"
            value={formatDuration(data.avgTimeToReviewMs)}
            sublabel={`across ${data.reviewedCount} reviewed report${data.reviewedCount !== 1 ? 's' : ''}`}
          />
          <MetricTile
            icon={Gauge}
            accent="#F2C8ED"
            label="Classifier Confidence"
            value={data.confidence ? data.confidence.avg.toFixed(2) : '—'}
            sublabel={
              data.confidence ? `range ${data.confidence.min.toFixed(2)}–${data.confidence.max.toFixed(2)}` : 'no data yet'
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-semibold text-text-primary">Reports by Urgency</h2>
          {urgencyChartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={urgencyChartData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {urgencyChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#A0A0A0' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="mb-2 font-semibold text-text-primary">Reports by Status</h2>
          {statusChartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusChartData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {statusChartData.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#A0A0A0' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold text-text-primary">Reports by Disaster Type</h2>
        {disasterTypeChartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={disasterTypeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis dataKey="type" tick={CHART_TICK} axisLine={{ stroke: CHART_AXIS }} />
              <YAxis allowDecimals={false} tick={CHART_TICK} axisLine={{ stroke: CHART_AXIS }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {disasterTypeChartData.map((_, i) => (
                  <Cell key={i} fill={DISASTER_COLORS[i % DISASTER_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold text-text-primary">Report Volume Over Time</h2>
        {volumeChartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={volumeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis dataKey="day" tick={CHART_TICK} axisLine={{ stroke: CHART_AXIS }} />
              <YAxis allowDecimals={false} tick={CHART_TICK} axisLine={{ stroke: CHART_AXIS }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="count" stroke="#A9DFD8" strokeWidth={2} dot={{ r: 3, fill: '#A9DFD8' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
