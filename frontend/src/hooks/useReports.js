import { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../services/api/reports';

export function useReports(params = {}) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  const paramsKey = JSON.stringify(params);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsApi.list(JSON.parse(paramsKey));
      setReports(data.reports);
      setPagination({ total: data.total, page: data.page, pages: data.pages });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [paramsKey]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { reports, loading, error, pagination, refetch };
}
