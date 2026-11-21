const rawApiUrl = import.meta.env.VITE_API_URL || '';
const API_BASE = rawApiUrl 
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`)
  : '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('civictrack_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  // Don't set Content-Type if FormData is used (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('civictrack_token');
      localStorage.removeItem('civictrack_user');
      throw new Error('Authentication session expired. Please sign in again with admin credentials at /login.');
    }
    let errMessage = `Error ${response.status}: ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData.detail) {
        errMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch (_) {}
    throw new Error(errMessage);
  }

  return response.json();
}

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Projects
  getProjects: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/projects?${query.toString()}`);
  },
  getProjectDetail: (id) => request(`/projects/${id}`),
  getProjectFinance: (id) => request(`/projects/${id}/finance`),
  getProjectProgress: (id) => request(`/projects/${id}/progress`),

  // Analytics
  getOverviewKPIs: () => request('/analytics/overview'),
  getDistrictStats: () => request('/analytics/districts'),
  getDepartmentStats: () => request('/analytics/departments'),

  // Map
  getMapProjects: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val && val !== 'all') query.append(key, val);
    });
    return request(`/map/projects?${query.toString()}`);
  },

  // AI & Risk
  getProjectPrediction: (id) => request(`/predictions/${id}`),
  getAnomalies: (district) => {
    const query = district && district !== 'all' ? `?district=${encodeURIComponent(district)}` : '';
    return request(`/anomalies${query}`);
  },
  analyzeImages: (formData) => request('/ai/image-analysis', {
    method: 'POST',
    body: formData,
  }),

  // Sources
  getSources: () => request('/sources'),

  // Auth & Admin
  login: async (username, password) => {
    const form = new URLSearchParams();
    form.append('username', username);
    form.append('password', password);

    const res = await fetch(`${API_BASE}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }

    const data = await res.json();
    localStorage.setItem('civictrack_token', data.access_token);
    localStorage.setItem('civictrack_user', JSON.stringify({ username: data.username, role: data.role }));
    return data;
  },
  logout: () => {
    localStorage.removeItem('civictrack_token');
    localStorage.removeItem('civictrack_user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('civictrack_user');
    return user ? JSON.parse(user) : null;
  },
  importCSV: (formData) => request('/admin/import/csv', {
    method: 'POST',
    body: formData,
  }),
  importExcel: (formData) => request('/admin/import/excel', {
    method: 'POST',
    body: formData,
  }),
  triggerSync: () => request('/admin/sync', { method: 'POST' }),
  reviewProject: (id, statusDecision, reviewerNotes) => {
    const form = new FormData();
    form.append('status_decision', statusDecision);
    form.append('reviewer_notes', reviewerNotes);
    return request(`/admin/projects/${id}/review`, {
      method: 'POST',
      body: form,
    });
  },
  getAdminLogs: () => request('/admin/logs'),

  // Public Datasets & Transparency Dossiers
  getDatasetsTransparency: () => request('/datasets/transparency'),
  getHousingDistrictSummary: () => request('/datasets/housing/district-summary'),
  getBmtcTransportSummary: () => request('/datasets/transport/bmtc-summary'),

  // data.gov.in Multi-Resource Actions
  getDatagovCatalog: () => request('/admin/datagov/catalog'),
  fetchDatagovDataset: (datasetKey, options = {}) => {
    const form = new FormData();
    if (options.dry_run) form.append('dry_run', 'true');
    if (options.limit) form.append('limit', options.limit);
    if (options.force_fallback) form.append('force_fallback', 'true');
    return request(`/admin/datagov/fetch/${datasetKey}`, {
      method: 'POST',
      body: form,
    });
  },
  fetchAllDatagovDatasets: (forceFallback = false) => {
    const form = new FormData();
    if (forceFallback) form.append('force_fallback', 'true');
    return request('/admin/datagov/fetch-all', {
      method: 'POST',
      body: form,
    });
  },
};
