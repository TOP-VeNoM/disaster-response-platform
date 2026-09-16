import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { reportsApi } from '../../services/api/reports';
import { disasterTypeLabel } from '../../shared/disasterTypes.js';
import { statusLabel, statusColor } from '../../utils/formatters';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export default function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  const runSearch = useCallback(async (q) => {
    if (q.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { reports } = await reportsApi.list({ search: q.trim(), limit: 8 });
      setResults(reports);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), DEBOUNCE_MS);
  }

  function handleSelect(reportId) {
    setOpen(false);
    setQuery('');
    setResults([]);
    navigate(`/reports/${reportId}`);
  }

  // Close the dropdown on outside click, same pattern as the profile menu in Header
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => () => debounceRef.current && clearTimeout(debounceRef.current), []);

  const showDropdown = open && query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div ref={containerRef} className="relative max-w-md flex-1">
      <div className="flex items-center gap-2 rounded-lg bg-surface-tile px-4 py-2.5">
        {loading ? (
          <Loader2 size={14} className="animate-spin text-text-muted" />
        ) : (
          <Search size={14} className="text-text-muted" />
        )}
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          placeholder="Search reports by description or address..."
          className="w-full bg-transparent text-xs text-text-secondary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-96 overflow-y-auto rounded-lg bg-surface-card shadow-xl">
          {results.length === 0 && !loading && (
            <p className="px-4 py-3 text-xs text-text-muted">No reports match "{query}"</p>
          )}
          {results.map((r) => (
            <button
              key={r._id}
              onClick={() => handleSelect(r._id)}
              className="flex w-full flex-col items-start gap-1 px-4 py-2.5 text-left hover:bg-surface-tile"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-medium uppercase text-text-muted">
                  {disasterTypeLabel(r.disasterType)}
                </span>
                <span className={`badge ${statusColor(r.status)}`}>{statusLabel(r.status)}</span>
              </div>
              <p className="text-sm text-text-primary">
                {r.description.length > 70 ? `${r.description.slice(0, 70)}...` : r.description}
              </p>
              {r.location?.address && <p className="text-[10px] text-text-muted">{r.location.address}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
