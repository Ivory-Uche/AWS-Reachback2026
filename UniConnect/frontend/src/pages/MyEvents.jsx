import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rsvpApi, eventsApi } from '../services/api';
import { useApp } from '../App';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

const IMAGE_GRADIENTS = {
  tech:      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  dance:     'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  wellness:  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  business:  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  sports:    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  design:    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  food:      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  hackathon: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  default:   'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
};

export default function MyEvents() {
  const navigate             = useNavigate();
  const { user }             = useApp();
  const [tab, setTab]        = useState('rsvps');       // 'rsvps' | 'created'
  const [rsvps, setRsvps]    = useState([]);
  const [created, setCreated]= useState([]);
  const [loading, setLoading]= useState(true);
  const [actionId, setAction]= useState(null);
  const [toast, setToast]    = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      rsvpApi.getMyRsvps(),
      eventsApi.getAll(),
    ]).then(([rsvpRes, eventsRes]) => {
      setRsvps(rsvpRes.data);
      // Filter events created by the current user
      const mine = eventsRes.data.filter(e => e.organizerId === (user?.id || 's1'));
      setCreated(mine);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleCancelRsvp = async (eventId) => {
    setAction(eventId);
    try {
      await rsvpApi.cancel(eventId);
      setRsvps(prev => prev.filter(r => r.eventId !== eventId));
      showToast('RSVP cancelled', 'info');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setAction(null);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    setAction(eventId);
    try {
      await eventsApi.delete(eventId);
      setCreated(prev => prev.filter(e => e.id !== eventId));
      showToast('Event deleted');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setAction(null);
    }
  };

  return (
    <div>
      {toast && (
        <div role="alert" style={{ ...s.toast, background: toast.type === 'error' ? 'var(--danger)' : toast.type === 'info' ? 'var(--primary)' : 'var(--success)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <h1 style={s.heading}>My Events</h1>
        {user && <p style={s.subheading}>Welcome back, {user.name.split(' ')[0]} 👋</p>}
      </div>

      {/* Tabs */}
      <div style={s.tabs} role="tablist">
        <button
          role="tab" aria-selected={tab === 'rsvps'}
          style={{ ...s.tab, ...(tab === 'rsvps' ? s.tabActive : {}) }}
          onClick={() => setTab('rsvps')}
        >
          My RSVPs {rsvps.length > 0 && <span style={s.count}>{rsvps.length}</span>}
        </button>
        <button
          role="tab" aria-selected={tab === 'created'}
          style={{ ...s.tab, ...(tab === 'created' ? s.tabActive : {}) }}
          onClick={() => setTab('created')}
        >
          Events I Created {created.length > 0 && <span style={s.count}>{created.length}</span>}
        </button>
      </div>

      {loading ? (
        <div style={s.center}><div style={s.spinner} /></div>
      ) : (
        <div role="tabpanel">
          {/* RSVPs tab */}
          {tab === 'rsvps' && (
            rsvps.length === 0 ? (
              <div style={s.empty}>
                <p style={{ fontSize: 40 }}>🎟️</p>
                <p style={{ fontWeight: 600, marginTop: 8 }}>No RSVPs yet</p>
                <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Browse events and RSVP to ones you want to attend</p>
                <button style={s.browseBtn} onClick={() => navigate('/')}>Browse Events</button>
              </div>
            ) : (
              <div style={s.list} aria-label="Your RSVPs">
                {rsvps.map(rsvp => {
                  const ev = rsvp.event;
                  if (!ev) return null;
                  const gradient = IMAGE_GRADIENTS[ev.image] || IMAGE_GRADIENTS.default;
                  return (
                    <article key={rsvp.id} style={s.item} aria-label={`RSVP for ${ev.title}`}>
                      <div style={{ ...s.itemStrip, background: gradient }} aria-hidden="true" />
                      <div style={s.itemBody}>
                        <div style={s.itemMain}>
                          <span style={s.itemCategory}>{ev.category}</span>
                          <h3 style={s.itemTitle}
                            onClick={() => navigate(`/events/${ev.id}`)}
                            role="button" tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && navigate(`/events/${ev.id}`)}
                          >{ev.title}</h3>
                          <p style={s.itemMeta}>📅 {formatDate(ev.date)} · 📍 {ev.location}</p>
                          <p style={s.itemMeta}>🏛️ {ev.club}</p>
                        </div>
                        <div style={s.itemActions}>
                          <span style={s.confirmedBadge}>✓ Confirmed</span>
                          <button style={s.viewBtn} onClick={() => navigate(`/events/${ev.id}`)}>View</button>
                          <button
                            style={s.cancelBtn}
                            onClick={() => handleCancelRsvp(ev.id)}
                            disabled={actionId === ev.id}
                            aria-label={`Cancel RSVP for ${ev.title}`}
                          >
                            {actionId === ev.id ? '…' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )
          )}

          {/* Created events tab */}
          {tab === 'created' && (
            created.length === 0 ? (
              <div style={s.empty}>
                <p style={{ fontSize: 40 }}>📢</p>
                <p style={{ fontWeight: 600, marginTop: 8 }}>You haven't created any events</p>
                <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Create your first event and invite your fellow students</p>
                <button style={s.browseBtn} onClick={() => navigate('/create')}>Create an Event</button>
              </div>
            ) : (
              <div style={s.list} aria-label="Events you created">
                {created.map(ev => {
                  const gradient = IMAGE_GRADIENTS[ev.image] || IMAGE_GRADIENTS.default;
                  return (
                    <article key={ev.id} style={s.item} aria-label={`Your event: ${ev.title}`}>
                      <div style={{ ...s.itemStrip, background: gradient }} aria-hidden="true" />
                      <div style={s.itemBody}>
                        <div style={s.itemMain}>
                          <span style={s.itemCategory}>{ev.category}</span>
                          <h3 style={s.itemTitle}
                            onClick={() => navigate(`/events/${ev.id}`)}
                            role="button" tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && navigate(`/events/${ev.id}`)}
                          >{ev.title}</h3>
                          <p style={s.itemMeta}>📅 {formatDate(ev.date)} · 📍 {ev.location}</p>
                          <p style={s.itemMeta}>👥 {ev.rsvpCount ?? 0} RSVP'd · {ev.spotsLeft ?? ev.capacity} spots left</p>
                        </div>
                        <div style={s.itemActions}>
                          <button style={s.viewBtn} onClick={() => navigate(`/events/${ev.id}`)}>View</button>
                          <button
                            style={s.deleteBtn}
                            onClick={() => handleDeleteEvent(ev.id)}
                            disabled={actionId === ev.id}
                            aria-label={`Delete ${ev.title}`}
                          >
                            {actionId === ev.id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  header: { marginBottom: 24 },
  heading: { fontSize: 28, fontWeight: 800 },
  subheading: { color: 'var(--text-muted)', marginTop: 4 },
  tabs: { display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 },
  tab: { padding: '10px 20px', border: 'none', background: 'none', fontWeight: 600, fontSize: 14, color: 'var(--text-muted)', borderBottom: '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  tabActive: { color: 'var(--primary)', borderBottom: '2px solid var(--primary)' },
  count: { background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 20, padding: '1px 8px', fontSize: 12 },
  center: { display: 'flex', justifyContent: 'center', padding: '64px 0' },
  spinner: { width: 36, height: 36, border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin .7s linear infinite' },
  empty: { textAlign: 'center', padding: '64px 0' },
  browseBtn: { marginTop: 16, padding: '10px 24px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 600 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  item: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', display: 'flex', boxShadow: 'var(--shadow)' },
  itemStrip: { width: 8, flexShrink: 0 },
  itemBody: { flex: 1, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  itemMain: { flex: 1, minWidth: 0 },
  itemCategory: { fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: .5 },
  itemTitle: { fontSize: 16, fontWeight: 700, marginTop: 2, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemMeta: { fontSize: 13, color: 'var(--text-muted)', marginTop: 4 },
  itemActions: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  confirmedBadge: { fontSize: 12, fontWeight: 600, color: 'var(--success)', background: '#ECFDF5', padding: '4px 10px', borderRadius: 20 },
  viewBtn: { padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontWeight: 500, fontSize: 13 },
  cancelBtn: { padding: '7px 16px', borderRadius: 8, border: '1px solid var(--danger)', background: '#fff', color: 'var(--danger)', fontWeight: 600, fontSize: 13 },
  deleteBtn: { padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--danger)', color: '#fff', fontWeight: 600, fontSize: 13 },
  toast: { position: 'fixed', bottom: 24, right: 24, color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 999, boxShadow: 'var(--shadow-lg)' },
};
