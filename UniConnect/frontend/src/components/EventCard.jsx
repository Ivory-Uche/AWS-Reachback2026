import React from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORY_COLORS = {
  Academic: { bg: '#EEF2FF', text: '#4F46E5' },
  Social:   { bg: '#FDF2F8', text: '#9D174D' },
  Workshop: { bg: '#ECFDF5', text: '#065F46' },
  Sports:   { bg: '#FFF7ED', text: '#9A3412' },
  default:  { bg: '#F3F4F6', text: '#374151' },
};

const IMAGE_GRADIENTS = {
  tech:      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  dance:     'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  wellness:  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  business:  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  sports:    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  design:    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  food:      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  hackathon: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  academic:  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  social:    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  workshop:  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  default:   'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function EventCard({ event, onRsvp, onCancel, loading }) {
  const navigate = useNavigate();
  const catColor = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.default;
  const gradient = IMAGE_GRADIENTS[event.image] || IMAGE_GRADIENTS.default;
  const isFull   = event.spotsLeft <= 0;

  return (
    <article style={s.card} role="article" aria-label={`Event: ${event.title}`}>
      {/* Color header */}
      <div
        style={{ ...s.cardHeader, background: gradient }}
        onClick={() => navigate(`/events/${event.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && navigate(`/events/${event.id}`)}
        aria-label={`View details for ${event.title}`}
      >
        <span style={{ ...s.categoryPill, background: catColor.bg, color: catColor.text }}>
          {event.category}
        </span>
        {event.isRsvped && <span style={s.rsvpedBadge}>✓ RSVP'd</span>}
        {isFull && !event.isRsvped && <span style={s.fullBadge}>Full</span>}
      </div>

      {/* Body */}
      <div style={s.cardBody}>
        <h3
          style={s.title}
          onClick={() => navigate(`/events/${event.id}`)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate(`/events/${event.id}`)}
        >
          {event.title}
        </h3>
        <p style={s.club}>{event.club}</p>
        <p style={s.description}>{event.description.slice(0, 100)}{event.description.length > 100 ? '…' : ''}</p>

        <div style={s.meta}>
          <span style={s.metaItem}>📅 {formatDate(event.date)} · {formatTime(event.date)}</span>
          <span style={s.metaItem}>📍 {event.location}</span>
          <span style={s.metaItem}>
            👥 {event.rsvpCount}/{event.capacity}
            {isFull
              ? <span style={{ color: 'var(--danger)', marginLeft: 4 }}>· Full</span>
              : <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>· {event.spotsLeft} left</span>
            }
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={s.cardFooter}>
        <button
          style={s.detailsBtn}
          onClick={() => navigate(`/events/${event.id}`)}
        >
          View Details
        </button>
        {event.isRsvped ? (
          <button
            style={s.cancelBtn}
            onClick={() => onCancel(event.id)}
            disabled={loading}
            aria-label={`Cancel RSVP for ${event.title}`}
          >
            {loading ? '…' : 'Cancel RSVP'}
          </button>
        ) : (
          <button
            style={{ ...s.rsvpBtn, ...(isFull ? s.disabledBtn : {}) }}
            onClick={() => onRsvp(event.id)}
            disabled={isFull || loading}
            aria-label={isFull ? `${event.title} is full` : `RSVP to ${event.title}`}
          >
            {loading ? '…' : isFull ? 'Full' : 'RSVP'}
          </button>
        )}
      </div>
    </article>
  );
}

const s = {
  card: {
    background: 'var(--card)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'box-shadow .2s, transform .2s',
  },
  cardHeader: {
    height: 120,
    position: 'relative',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-start',
    padding: 12,
    gap: 8,
  },
  categoryPill: {
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 20,
  },
  rsvpedBadge: {
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 20,
    background: 'var(--success)',
    color: '#fff',
  },
  fullBadge: {
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 20,
    background: 'var(--danger)',
    color: '#fff',
  },
  cardBody: { padding: '16px 16px 0', flex: 1 },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: 2,
    cursor: 'pointer',
    lineHeight: 1.3,
  },
  club: { fontSize: 13, color: 'var(--primary)', fontWeight: 500, marginBottom: 8 },
  description: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 },
  meta: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 },
  metaItem: { fontSize: 13, color: 'var(--text-muted)' },
  cardFooter: {
    padding: '12px 16px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    gap: 8,
  },
  detailsBtn: {
    flex: 1,
    padding: '8px 0',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: '#fff',
    color: 'var(--text)',
    fontWeight: 500,
    fontSize: 13,
  },
  rsvpBtn: {
    flex: 1,
    padding: '8px 0',
    borderRadius: 8,
    border: 'none',
    background: 'var(--primary)',
    color: '#fff',
    fontWeight: 600,
    fontSize: 13,
  },
  cancelBtn: {
    flex: 1,
    padding: '8px 0',
    borderRadius: 8,
    border: '1px solid var(--danger)',
    background: '#fff',
    color: 'var(--danger)',
    fontWeight: 600,
    fontSize: 13,
  },
  disabledBtn: {
    background: 'var(--border)',
    color: 'var(--text-muted)',
    cursor: 'not-allowed',
  },
};
