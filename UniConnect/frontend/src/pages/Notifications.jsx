import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../services/api';

const TYPE_META = {
  reminder:     { icon: '🔔', color: 'var(--warning)',  label: 'Reminder' },
  confirmation: { icon: '✅', color: 'var(--success)',  label: 'Confirmed' },
  cancellation: { icon: '❌', color: 'var(--danger)',   label: 'Cancelled' },
  approval:     { icon: '🎉', color: 'var(--success)',  label: 'Approved' },
  rejection:    { icon: '⛔', color: 'var(--danger)',   label: 'Rejected' },
  default:      { icon: '📣', color: 'var(--primary)',  label: 'Notice' },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function Notifications({ onRead }) {
  const navigate = useNavigate();
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchNotifs = () => {
    notificationsApi.getAll()
      .then(r => setNotifs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifs(); }, []);

  const handleMarkRead = async (id) => {
    await notificationsApi.markRead(id).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    onRead();
  };

  const handleMarkAllRead = async () => {
    setMarking(true);
    await notificationsApi.markAllRead().catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    onRead();
    setMarking(false);
  };

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.heading}>Notifications</h1>
          <p style={s.subheading}>
            {unread > 0 ? `${unread} unread notification${unread !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unread > 0 && (
          <button style={s.markAllBtn} onClick={handleMarkAllRead} disabled={marking} aria-label="Mark all notifications as read">
            {marking ? 'Marking…' : 'Mark all as read'}
          </button>
        )}
      </div>

      {loading ? (
        <div style={s.center}><div style={s.spinner} role="status" aria-label="Loading notifications" /></div>
      ) : notifs.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: 48 }}>🔕</p>
          <p style={{ fontWeight: 600, marginTop: 12 }}>No notifications yet</p>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>RSVP to events to get reminders here</p>
        </div>
      ) : (
        <ul style={s.list} aria-label="Notifications list">
          {notifs.map(notif => {
            const meta = TYPE_META[notif.type] || TYPE_META.default;
            return (
              <li
                key={notif.id}
                style={{ ...s.item, ...(notif.read ? s.itemRead : s.itemUnread) }}
                aria-label={`${notif.read ? 'Read' : 'Unread'} ${meta.label}: ${notif.message}`}
              >
                <div style={{ ...s.iconWrap, background: `${meta.color}18` }}>
                  <span style={s.icon} aria-hidden="true">{meta.icon}</span>
                </div>
                <div style={s.content}>
                  <div style={s.topRow}>
                    <span style={{ ...s.typeLabel, color: meta.color }}>{meta.label}</span>
                    <span style={s.time}>{timeAgo(notif.createdAt)}</span>
                  </div>
                  <p style={s.message}>{notif.message}</p>
                  <div style={s.actions}>
                    {notif.eventId && (
                      <button
                        style={s.viewBtn}
                        onClick={() => navigate(`/events/${notif.eventId}`)}
                        aria-label={`View event for notification: ${notif.message}`}
                      >
                        View Event →
                      </button>
                    )}
                    {!notif.read && (
                      <button
                        style={s.readBtn}
                        onClick={() => handleMarkRead(notif.id)}
                        aria-label="Mark notification as read"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
                {!notif.read && <div style={s.dot} aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const s = {
  page: { maxWidth: 680, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  heading: { fontSize: 28, fontWeight: 800 },
  subheading: { color: 'var(--text-muted)', marginTop: 4 },
  markAllBtn: { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontWeight: 500, fontSize: 13, flexShrink: 0 },
  center: { display: 'flex', justifyContent: 'center', padding: '64px 0' },
  spinner: { width: 36, height: 36, border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin .7s linear infinite' },
  empty: { textAlign: 'center', padding: '80px 0' },
  list: { display: 'flex', flexDirection: 'column', gap: 1, listStyle: 'none' },
  item: { display: 'flex', gap: 14, padding: '16px 20px', borderRadius: 'var(--radius)', marginBottom: 8, position: 'relative', border: '1px solid var(--border)', transition: 'background .15s' },
  itemUnread: { background: 'var(--primary-light)', borderColor: '#C7D2FE' },
  itemRead: { background: 'var(--card)' },
  iconWrap: { width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon: { fontSize: 18 },
  content: { flex: 1, minWidth: 0 },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  typeLabel: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5 },
  time: { fontSize: 12, color: 'var(--text-muted)' },
  message: { fontSize: 14, color: 'var(--text)', lineHeight: 1.5 },
  actions: { display: 'flex', gap: 8, marginTop: 10 },
  viewBtn: { fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', padding: 0, fontWeight: 600 },
  readBtn: { fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', padding: 0 },
  dot: { position: 'absolute', top: 16, right: 16, width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' },
};
