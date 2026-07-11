import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi, rsvpApi } from '../services/api';

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

function formatDateLong(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function EventDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [event, setEvent]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [actioning, setActioning] = useState(false);
  const [toast, setToast]   = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchEvent = () => {
    setLoading(true);
    eventsApi.getOne(id)
      .then(r => { setEvent(r.data); setError(null); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvent(); }, [id]);

  const handleRsvp = async () => {
    setActioning(true);
    try {
      const r = await rsvpApi.rsvp(id);
      showToast(r.message);
      fetchEvent();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setActioning(false);
    }
  };

  const handleCancel = async () => {
    setActioning(true);
    try {
      const r = await rsvpApi.cancel(id);
      showToast(r.message, 'info');
      fetchEvent();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setActioning(false);
    }
  };

  if (loading) return (
    <div style={s.center}>
      <div style={s.spinner} aria-label="Loading event details" role="status" />
    </div>
  );

  if (error) return (
    <div style={s.errorBox} role="alert">
      <p>⚠️ {error}</p>
      <button style={s.backBtn} onClick={() => navigate(-1)}>← Go Back</button>
    </div>
  );

  if (!event) return null;

  const gradient = IMAGE_GRADIENTS[event.image] || IMAGE_GRADIENTS.default;
  const isFull   = event.spotsLeft <= 0 && !event.isRsvped;
  const pct      = Math.round((event.rsvpCount / event.capacity) * 100);

  return (
    <div>
      {toast && (
        <div role="alert" style={{ ...s.toast, background: toast.type === 'error' ? 'var(--danger)' : toast.type === 'info' ? 'var(--primary)' : 'var(--success)' }}>
          {toast.msg}
        </div>
      )}

      {/* Back */}
      <button style={s.backBtn} onClick={() => navigate(-1)} aria-label="Back to events list">← Back to Events</button>

      {/* Hero */}
      <div style={{ ...s.hero, background: gradient }} role="img" aria-label={`${event.category} event banner`}>
        <div style={s.heroContent}>
          <span style={s.categoryPill}>{event.category}</span>
          {event.isRsvped && <span style={s.rsvpedPill}>✓ You're going!</span>}
        </div>
      </div>

      {/* Content */}
      <div style={s.layout}>
        {/* Main */}
        <div style={s.main}>
          <h1 style={s.title}>{event.title}</h1>
          <p style={s.club}>Organised by {event.club} · {event.organizer}</p>

          <section aria-labelledby="about-heading">
            <h2 id="about-heading" style={s.sectionTitle}>About this Event</h2>
            <p style={s.description}>{event.description}</p>
          </section>

          {event.tags && event.tags.length > 0 && (
            <div style={s.tags} aria-label="Event tags">
              {event.tags.map(tag => (
                <span key={tag} style={s.tag}>#{tag}</span>
              ))}
            </div>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <section aria-labelledby="attendees-heading" style={{ marginTop: 24 }}>
              <h2 id="attendees-heading" style={s.sectionTitle}>
                Who's Going ({event.rsvpCount})
              </h2>
              <div style={s.attendees}>
                {event.attendees.slice(0, 8).map((a, i) => (
                  <div key={i} style={s.attendeeAvatar} title={a.name} aria-label={a.name}>
                    {a.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                ))}
                {event.rsvpCount > 8 && (
                  <div style={{ ...s.attendeeAvatar, background: 'var(--border)', color: 'var(--text-muted)', fontSize: 12 }}>
                    +{event.rsvpCount - 8}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside style={s.sidebar} aria-label="Event details">
          {/* Details card */}
          <div style={s.card}>
            <h2 style={s.sectionTitle}>Event Details</h2>
            <dl style={s.detailList}>
              <div style={s.detailItem}>
                <dt style={s.detailIcon}>📅</dt>
                <dd>
                  <strong>{formatDateLong(event.date)}</strong>
                  <br />
                  <span style={{ color: 'var(--text-muted)' }}>{formatTime(event.date)}</span>
                  {event.endDate !== event.date && (
                    <span style={{ color: 'var(--text-muted)' }}> – {formatDateLong(event.endDate)}</span>
                  )}
                </dd>
              </div>
              <div style={s.detailItem}>
                <dt style={s.detailIcon}>📍</dt>
                <dd>{event.location}</dd>
              </div>
              <div style={s.detailItem}>
                <dt style={s.detailIcon}>👥</dt>
                <dd>
                  {event.rsvpCount} / {event.capacity} spots filled
                  <div style={s.progressBar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% full`}>
                    <div style={{ ...s.progressFill, width: `${pct}%`, background: pct >= 90 ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : 'var(--success)' }} />
                  </div>
                  <span style={{ fontSize: 12, color: pct >= 90 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {event.spotsLeft > 0 ? `${event.spotsLeft} spots left` : 'Fully booked'}
                  </span>
                </dd>
              </div>
            </dl>

            {/* RSVP Button */}
            {event.isRsvped ? (
              <button
                style={s.cancelBtn}
                onClick={handleCancel}
                disabled={actioning}
                aria-label="Cancel your RSVP"
              >
                {actioning ? 'Cancelling…' : '✕ Cancel RSVP'}
              </button>
            ) : (
              <button
                style={{ ...s.rsvpBtn, ...(isFull ? s.disabledBtn : {}) }}
                onClick={handleRsvp}
                disabled={isFull || actioning}
                aria-label={isFull ? 'Event is full' : 'RSVP to this event'}
              >
                {actioning ? 'Processing…' : isFull ? 'Event Full' : '✓ RSVP Now'}
              </button>
            )}

            {event.isRsvped && (
              <p style={s.reminderNote}>
                🔔 You'll receive reminders 24 hours and 1 hour before this event.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

const s = {
  center: { display: 'flex', justifyContent: 'center', padding: '64px 0' },
  spinner: { width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin .7s linear infinite' },
  errorBox: { background: '#FEF2F2', padding: 24, borderRadius: 'var(--radius)', color: 'var(--danger)', textAlign: 'center' },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary)', background: 'none', border: 'none', fontWeight: 500, marginBottom: 20, padding: 0, fontSize: 14 },
  hero: { height: 220, borderRadius: 'var(--radius)', marginBottom: 24, display: 'flex', alignItems: 'flex-end', padding: 16 },
  heroContent: { display: 'flex', gap: 8 },
  categoryPill: { background: 'rgba(255,255,255,.9)', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  rsvpedPill: { background: 'var(--success)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  layout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' },
  main: {},
  title: { fontSize: 28, fontWeight: 800, marginBottom: 4, lineHeight: 1.3 },
  club: { color: 'var(--primary)', fontWeight: 500, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--text)' },
  description: { color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 15 },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  tag: { background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500 },
  attendees: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  attendeeAvatar: { width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  sidebar: {},
  card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, boxShadow: 'var(--shadow)' },
  detailList: { display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20, listStyle: 'none' },
  detailItem: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  detailIcon: { fontSize: 18, flexShrink: 0, paddingTop: 1 },
  progressBar: { height: 6, background: 'var(--border)', borderRadius: 3, margin: '6px 0 4px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, transition: 'width .3s' },
  rsvpBtn: { width: '100%', padding: '12px 0', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 12 },
  cancelBtn: { width: '100%', padding: '12px 0', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger)', background: '#fff', color: 'var(--danger)', fontWeight: 700, fontSize: 16, marginBottom: 12 },
  disabledBtn: { background: 'var(--border)', color: 'var(--text-muted)', cursor: 'not-allowed' },
  reminderNote: { fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 },
  toast: { position: 'fixed', bottom: 24, right: 24, color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 999, boxShadow: 'var(--shadow-lg)' },
};
