import client from './client';

export const agentApi = {
  listPending: () => client.get('/agent/pending').then((r) => r.data),
  getTimeline: (reportId) => client.get(`/agent/${reportId}/timeline`).then((r) => r.data),
  approve: (reportId, notes) => client.post(`/agent/${reportId}/approve`, { notes }).then((r) => r.data),
  reject: (reportId, notes) => client.post(`/agent/${reportId}/reject`, { notes }).then((r) => r.data),
  editPlan: (reportId, plan) => client.post(`/agent/${reportId}/edit-plan`, plan).then((r) => r.data),
  rerun: (reportId) => client.post(`/agent/${reportId}/rerun`).then((r) => r.data)
};

