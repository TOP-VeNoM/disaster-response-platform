import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { agentApi } from '../../services/api/agent';
import { disasterTypeLabel } from '../../shared/disasterTypes.js';
import { formatRelativeTime } from '../../utils/formatters';

const POLL_MS = 15000;
const SEEN_IDS_STORAGE_KEY = 'dr_platform_seen_report_ids';

/**
 * "New" here means "currently awaiting_review and not yet seen by this
 * browser" — scoped to the responder/admin review queue, since that's the
 * actionable notion of "new report" for the roles that can act on one. A
 * reporter's own report progressing through the pipeline isn't surfaced
 * here; that's visible on the report's own detail page already.
 *
 * Seen IDs persist in localStorage (not just component state) so refreshing
 * the page or closing the dropdown doesn't re-surface the same reports as
 * new again — only reports that are new since the LAST time you actually
 * looked count as unread.
 */
function loadSeenIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_IDS_STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids) {
  localStorage.setItem(SEEN_IDS_STORAGE_KEY, JSON.stringify(Array.from(ids)));
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const seenIdsRef = useRef(loadSeenIds());

  const isResponder = user?.role === 'responder' || user?.role === 'admin';

  const poll = useCallback(async () => {
    if (!isResponder) return;
    try {
      const { reports: pending } = await agentApi.listPending();
      setReports(pending);
    } catch {
      // Silent — a failed notification poll shouldn't surface an error
      // toast on top of whatever the person is actually doing.
    }
  }, [isResponder]);

  useEffect(() => {
    if (!isResponder) return undefined;
    poll();
    const handle = setInterval(poll, POLL_MS);
    return () => clearInterval(handle);
  }, [isResponder, poll]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isResponder) return null;

  const unseenReports = reports.filter((r) => !seenIdsRef.current.has(r._id));

  function handleOpen() {
    setOpen((o) => !o);
  }

  function handleSelect(reportId) {
    seenIdsRef.current.add(reportId);
    saveSeenIds(seenIdsRef.current);
    setOpen(false);
    navigate(`/reports/${reportId}`);
  }

  function handleMarkAllSeen() {
    reports.forEach((r) => seenIdsRef.current.add(r._id));
    saveSeenIds(seenIdsRef.current);
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button onClick={handleOpen} className="relative text-text-muted hover:text-text-primary" title="Notifications">
        <Bell size={16} />
        {unseenReports.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-critical text-[9px] font-bold text-white">
            {unseenReports.length > 9 ? '9+' : unseenReports.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-lg bg-surface-card shadow-xl">
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-2.5">
            <span className="text-xs font-semibold text-text-primary">Reports awaiting review</span>
            {reports.length > 0 && (
              <button onClick={handleMarkAllSeen} className="text-[10px] text-accent-mint hover:underline">
                Mark all seen
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {reports.length === 0 ? (
              <p className="px-4 py-4 text-center text-xs text-text-muted">Nothing awaiting review right now.</p>
            ) : (
              reports.map((r) => (
                <button
                  key={r._id}
                  onClick={() => handleSelect(r._id)}
                  className="flex w-full flex-col items-start gap-1 border-b border-surface-border px-4 py-2.5 text-left last:border-0 hover:bg-surface-tile"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-[10px] font-medium uppercase text-text-muted">
                      {disasterTypeLabel(r.disasterType)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {!seenIdsRef.current.has(r._id) && <span className="h-1.5 w-1.5 rounded-full bg-accent-mint" />}
                      <span className="text-[10px] text-text-muted">{formatRelativeTime(r.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-text-primary">
                    {r.description.length > 60 ? `${r.description.slice(0, 60)}...` : r.description}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
