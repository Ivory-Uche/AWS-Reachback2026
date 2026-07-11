const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ─── Events ──────────────────────────────────────────────────────────────────
export const eventsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/events${qs ? '?' + qs : ''}`);
  },
  getOne: (id) => request(`/events/${id}`),
  create: (body) => request('/events', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/events/${id}`, { method: 'DELETE' }),
};

// ─── RSVP ─────────────────────────────────────────────────────────────────────
export const rsvpApi = {
  getMyRsvps: () => request('/rsvp'),
  rsvp: (eventId) => request(`/rsvp/${eventId}`, { method: 'POST' }),
  cancel: (eventId) => request(`/rsvp/${eventId}`, { method: 'DELETE' }),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => request('/notifications'),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
};

// ─── Students ────────────────────────────────────────────────────────────────
export const studentsApi = {
  me: () => request('/students/me'),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  me: () => request('/admin/me'),
  getEvents: (status) => request(`/admin/events${status ? '?status=' + status : ''}`),
  approve: (id) => request(`/admin/events/${id}/approve`, { method: 'PUT' }),
  reject: (id, reason) => request(`/admin/events/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  }),
};
