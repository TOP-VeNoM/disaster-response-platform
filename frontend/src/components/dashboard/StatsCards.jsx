import { FileText, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

const TILES = [
  { key: 'total', label: 'Total Reports', icon: FileText, accent: '#FEB95A' },
  { key: 'awaitingReview', label: 'Awaiting Review', icon: Clock, accent: '#A9DFD8' },
  { key: 'critical', label: 'Critical / High', icon: AlertTriangle, accent: '#F2C8ED' },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle2, accent: '#28AEF3' }
];

export default function StatsCards({ stats }) {
  return (
    <div className="card">
      <p className="mb-1 text-sm font-semibold text-text-primary">Report Overview</p>
      <p className="mb-4 text-[10px] text-text-muted">Live summary across all reports</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {TILES.map(({ key, label, icon: Icon, accent }) => (
          <div key={key} className="tile flex flex-col gap-3">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ backgroundColor: `${accent}22` }}
            >
              <Icon size={14} style={{ color: accent }} />
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">{stats[key]}</p>
              <p className="text-[10px] text-text-secondary">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

