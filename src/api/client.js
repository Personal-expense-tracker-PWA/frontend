import { enqueueWrite, getQueue, removeFromQueue } from '../utils/offlineQueue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function getToken() {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

export class QueuedOfflineError extends Error {
  constructor() {
    super('Saved offline — will sync when back online');
    this.queued = true;
  }
}

async function request(path, { method = 'GET', body, auth = true, queueOnOffline = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    if (queueOnOffline) {
      enqueueWrite({ path, method, body });
      throw new QueuedOfflineError();
    }
    throw networkErr;
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function flushQueue() {
  const queue = getQueue();
  for (const item of queue) {
    try {
      await request(item.path, { method: item.method, body: item.body });
      removeFromQueue(item.id);
    } catch (err) {
      if (err instanceof QueuedOfflineError || !navigator.onLine) break;
      // Server rejected the queued write (e.g. now-invalid data) — drop it rather than retry forever
      removeFromQueue(item.id);
    }
  }
}

export const api = {
  auth: {
    status: () => request('/auth/status', { auth: false }),
    setPin: (pin) => request('/auth/set-pin', { method: 'POST', body: { pin }, auth: false }),
    verifyPin: (pin, remember) =>
      request('/auth/verify-pin', { method: 'POST', body: { pin, remember }, auth: false }),
    changePin: (oldPin, newPin) =>
      request('/auth/change-pin', { method: 'POST', body: { oldPin, newPin } }),
  },
  expenses: {
    list: (params = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
      ).toString();
      return request(`/expenses${qs ? `?${qs}` : ''}`);
    },
    create: (data) => request('/expenses', { method: 'POST', body: data, queueOnOffline: true }),
    update: (id, data) => request(`/expenses/${id}`, { method: 'PUT', body: data, queueOnOffline: true }),
    remove: (id) => request(`/expenses/${id}`, { method: 'DELETE', queueOnOffline: true }),
  },
  categories: {
    list: () => request('/categories'),
    create: (data) => request('/categories', { method: 'POST', body: data }),
    update: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: data }),
    remove: (id, reassignTo) =>
      request(`/categories/${id}${reassignTo ? `?reassign_to=${reassignTo}` : ''}`, { method: 'DELETE' }),
  },
  summary: {
    dashboard: () => request('/summary/dashboard'),
    monthly: (params = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
      ).toString();
      return request(`/summary/monthly${qs ? `?${qs}` : ''}`);
    },
  },
  settings: {
    get: () => request('/settings'),
    update: (data) => request('/settings', { method: 'PUT', body: data }),
  },
  data: {
    exportJson: () => request('/export/json'),
    importJson: (data) => request('/import/json', { method: 'POST', body: data }),
    exportCsv: async (params = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
      ).toString();
      const res = await fetch(`${API_URL}/export/csv${qs ? `?${qs}` : ''}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to export CSV');
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : `expenses-${Date.now()}.csv`;
      const blob = await res.blob();
      return { blob, filename };
    },
  },
};

export { getToken, API_URL };
