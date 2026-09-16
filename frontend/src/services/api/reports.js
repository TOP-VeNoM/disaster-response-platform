import client from './client';

export const reportsApi = {
  create: (data) => client.post('/reports', data).then((r) => r.data),
  list: (params) => client.get('/reports', { params }).then((r) => r.data),
  get: (id) => client.get(`/reports/${id}`).then((r) => r.data),
  getMapData: () => client.get('/reports/map-data').then((r) => r.data),
  getAnalytics: () => client.get('/reports/analytics').then((r) => r.data)
};



