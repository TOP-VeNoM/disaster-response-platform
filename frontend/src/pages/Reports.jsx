import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import ReportList from '../components/reports/ReportList.jsx';
import ReportFilters from '../components/reports/ReportFilters.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

export default function Reports() {
  const [filters, setFilters] = useState({});
  const { reports, loading, error } = useReports(filters);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Reports</h1>
        <Link to="/reports/new" className="btn-primary">
          + New Report
        </Link>
      </div>

      <div className="mt-4">
        <ReportFilters filters={filters} onChange={setFilters} />
      </div>

      <div className="mt-4">
        {loading ? (
          <LoadingSpinner label="Loading reports..." />
        ) : error ? (
          <p className="text-sm text-status-critical">{error}</p>
        ) : (
          <ReportList reports={reports} />
        )}
      </div>
    </div>
  );
}
