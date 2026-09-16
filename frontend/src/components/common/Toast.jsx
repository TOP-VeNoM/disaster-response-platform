import { useContext } from 'react';
import { NotificationContext } from '../../context/NotificationContext.jsx';

const STYLES = {
  info: 'bg-gray-800',
  success: 'bg-status-low',
  error: 'bg-status-critical',
  warning: 'bg-status-medium'
};

export default function Toast() {
  const { toasts, dismiss } = useContext(NotificationContext);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${STYLES[t.type] || STYLES.info} flex items-center gap-3 rounded-md px-4 py-3 text-sm text-white shadow-lg`}
        >
          <span>{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="text-white/70 hover:text-white">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
