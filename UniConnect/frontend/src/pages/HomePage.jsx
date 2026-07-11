import React, { useState, useEffect, useCallback } from 'react';
import { eventsApi, rsvpApi } from '../services/api';
import EventCard from '../components/EventCard';

const CATEGORIES = ['All', 'Academic', 'Social', 'Workshop', 'Sports'];

export default function HomePage() {
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('All');
  const [actionLoading, setAction]  = useState(null); // eventId being acted on
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchEvents = useCallback(() => {
    setLoading(true);
    const params = { upcoming: 'true' };
    if (category !== 'All') params.category = category;
    if (search.trim()) params.search = search.trim();

    eventsApi.getAll(params)
      .then(r => { setEvents(r.data); setError(null); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [category, search]);

  useEffect(() => {
    const timer = setTimeout(fetchEvents, 300);
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  const handleRsvp = async (eventId) => {
    setAction(eventId);
    try {
      const r = await rsvpApi.rsvp(eventId);
      showToast(r.message);
      fetchEvents();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setAction(null);
    }
  };

  const handleCancel = async (eventId) => {
    setAction(eventId);
    try {
      const r = await rsvpApi.cancel(eventId);
      showToast(r.message, 'info');
      fetchEvents();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setAction(null);
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div role="alert" style={{ ...s.toast, background: toast.type === 'error' ? 'var(--danger)' : toast.type === 'info' ? 'var(--primary)' : 'var(--success)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.heading}>Upcoming Events</h1>
          <p style={s.subheading}>Discover what's happening on campus</p>
        </div>
      </div>

      {/* Filters */}
      <div style={s.filters}>
        <input
          type="search"
          placeholder="Search events, clubs, tags…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={s.searchInput}
          aria-label="Search events"
        />
        <div style={s.categoryTabs} role="tablist" aria-label="Filter by category">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              role="tab"
              aria-selected={category === cat}
              style={{ ...s.tab, ...(category === cat ? s.tabActive : {}) }}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div style={s.center} aria-live="polite" aria-busy="true">
          <div style={s.spinner} aria-hidden="true" />
          <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Loading events…</p>
        </div>
      )}

      {error && !loading && (
        <div style={s.error} role="alert">
          <p>⚠️ Could not load events: {error}</p>
          <button style={s.retryBtn} onClick={fetchEvents}>Retry</button>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div style={s.empty}>
          <p style={{ fontSize: 40 }}>🔍</p>
          <p style={{ fontWeight: 600, marginTop: 8 }}>No events found</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Try a different search or category</p>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <>
          <p style={s.resultCount} aria-live="polite">{events.length} event{events.length !== 1 ? 's' : ''} found</p>
          <div style={s.grid} role="list" aria-label="Events list">
            {events.map(event => (
              <div key={event.id} role="listitem">
                <EventCard
                  event={event}
                  onRsvp={handleRsvp}
                  onCancel={handleCancel}
                  loading={actionLoading === event.id}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const s = {
  header: { marginBottom: 24 },
  heading: { fontSize: 28, fontWeight: 800, color: 'var(--text)' },
  subheading: { color: 'var(--text-muted)', marginTop: 4 },
  filters: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 },
  searchInput: {
    width: '100%',
    maxWidth: 480,
    padding: '10px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    fontSize: 14,
    outline: 'none',
    background: '#fff',
  },
  categoryTabs: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tab: {
    padding: '6px 16px',
    borderRadius: 20,
    border: '1px solid var(--border)',
    background: '#fff',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-muted)',
    transition: 'all .15s',
  },
  tabActive: {
    background: 'var(--primary)',
    color: '#fff',
    border: '1px solid var(--primary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20,
  },
  resultCount: { color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0' },
  spinner: {
    width: 36, height: 36,
    border: '3px solid var(--border)',
    borderTop: '3px solid var(--primary)',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  error: { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: 20, textAlign: 'center', color: 'var(--danger)' },
  retryBtn: { marginTop: 12, padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '64px 0' },
  toast: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    color: '#fff',
    padding: '12px 20px',
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 14,
    zIndex: 999,
    boxShadow: 'var(--shadow-lg)',
    maxWidth: 360,
    animation: 'fadeIn .2s ease',
  },
};
