import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected'];

const STATUS_STYLE = {
  pending:  { bg: '#FEF3C7', color: '#92400E', label: 'Pending Review' },
  approved: { bg: '#ECFDF5', color: '#065F46', label: 'Approved' },
  rejected: { bg: '#FEF2F2', color: '#991B1B', label: 'Rejected' },
};

const IMAGE_GRADIENTS = {
  tech:      'linear-gradient(135deg,#667eea,#764ba2)',
  dance:     'linear-gradient(135deg,#f093fb,#f5576c)',
  wellness:  'linear-gradient(135deg,#4facfe,#00f2fe)',
  business:  'linear-gradient(135deg,#43e97b,#38f9d7)',
  sports:    'linear-gradient(135deg,#fa709a,#fee140)',
  design:    'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  food:      'linear-gradient(135deg,#ffecd2,#fcb69f)',
  hackathon: 'linear-gradient(135deg,#30cfd0,#330867)',
  academic:  'linear-gradient(135deg,#667eea,#764ba2)',
  social:    'linear-gradient(135deg,#f093fb,#f5576c)',
  workshop:  'linear-gradient(135deg,#4facfe,#00f2fe)',
  default:   'linear-gradient(135deg,#e0c3fc,#8ec5fc)',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function timeAgo(iso) {
  if (!iso) return '—';
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Reject modal ─────────────────────────────────────────────────────────────
function RejectModal({ event, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  const PRESETS = [
    'Venue not available on this date',
    'Insufficient safety arrangements described',
    'Event overlaps with an existing approved event',
    'Missing required club approval documentation',
    'Budget or resource concerns need clarification',
  ];

  return (
    <div style={m.overlay} role="dialog" aria-modal="true" aria-labelledby="reject-title">
      <div style={m.modal}>
        <h2 id="reject-title" style={m.title}>Reject Event</h2>
        <p style={m.subtitle}>
          You are rejecting <strong>"{event.title}"</strong>. The organiser will be notified
          with your reason.
        </p>

        <p style={m.label}>Quick reasons</p>
        <div style={m.presets}>
          {PRESETS.map(p => (
            <button
              key={p}
              style={{ ...m.preset, ...(reason === p ? m.presetActive : {}) }}
              onClick={() => setReason(p)}
              type="button"
            >
              {p}
            </button>
          ))}
        </div>

        <label htmlFor="custom-reason" style={m.label}>Or write a custom reason *</label>
        <textarea
          id="custom-reason"
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="Explain clearly so the organiser can resubmit with changes…"
          style={m.textarea}
          aria-required="true"
        />

        <div style={m.actions}>
          <button style={m.cancelBtn} onClick={onCancel} disabled={loading}>Cancel</button>
          <button
            style={{ ...m.rejectBtn, ...((!reason.trim() || loading) ? m.disabledBtn : {}) }}
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || loading}
            aria-label="Confirm rejection"
          >
            {loading ? 'Rejecting…' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Event review card ────────────────────────────────────────────────────────
function ReviewCard({ event, onApprove, onReject, actionId }) {
  const navigate  = useNavigate();
  const gradient  = IMAGE_GRADIENTS[event.image] || IMAGE_GRADIENTS.default;
  const st        = STATUS_STYLE[event.status] || STATUS_STYLE.pending;
  const isLoading = actionId === event.id;

  return (
    <article style={c.card} aria-label={`Review card: ${event.title}`}>
      {/* Colour strip */}
      <div style={{ ...c.strip, background: gradient }} aria-hidden="true" />

      <div style={c.body}>
        {/* Top row */}
        <div style={c.topRow}>
          <div style={c.titleGroup}>
            <span style={{ ...c.statusPill, background: st.bg, color: st.color }}>
              {st.label}
            </span>
            <h3 style={c.title}>{event.title}</h3>
            <p style={c.meta}>
              <span style={c.category}>{event.category}</span>
              &nbsp;·&nbsp;{event.club}
              &nbsp;·&nbsp;by <strong>{event.organizer}</strong>
            </p>
          </div>
          <div style={c.submittedCol}>
            <p style={c.submittedLabel}>Submitted</p>
            <p style={c.submittedTime}>{timeAgo(event.createdAt)}</p>
            <p style={c.submittedDate}>{formatDate(event.createdAt)}</p>
          </div>
        </div>

        {/* Details grid */}
        <div style={c.details}>
          <span style={c.detail}>📅 {formatDate(event.date)}</span>
          <span style={c.detail}>📍 {event.location}</span>
          <span style={c.detail}>👥 Capacity: {event.capacity}</span>
          {event.tags?.length > 0 && (
            <span style={c.detail}>🏷️ {event.tags.join(', ')}</span>
          )}
        </div>

        {/* Description preview */}
        <p style={c.description}>
          {event.description.length > 160
            ? event.description.slice(0, 160) + '…'
            : event.description}
        </p>

        {/* Rejection reason (if any) */}
        {event.status === 'rejected' && event.rejectionReason && (
          <div style={c.rejectionBox} role="note" aria-label="Rejection reason">
            <strong>Rejection reason:</strong> {event.rejectionReason}
          </div>
        )}

        {/* Actions */}
        <div style={c.actions}>
          <button
            style={c.viewBtn}
            onClick={() => navigate(`/events/${event.id}`)}
            aria-label={`View full details for ${event.title}`}
          >
            View Details
          </button>

          {event.status === 'pending' && (
            <>
              <button
                style={{ ...c.approveBtn, ...(isLoading ? c.loadingBtn : {}) }}
                onClick={() => onApprove(event)}
                disabled={isLoading}
                aria-label={`Approve ${event.title}`}
              >
                {isLoading ? '…' : '✓ Approve'}
              </button>
              <button
                style={{ ...c.rejectBtn, ...(isLoading ? c.loadingBtn : {}) }}
                onClick={() => onReject(event)}
                disabled={isLoading}
                aria-label={`Reject ${event.title}`}
              >
                {isLoading ? '…' : '✕ Reject'}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Main AdminDashboard page ─────────────────────────────────────────────────
export default function AdminDashboard() {
  const [admin, setAdmin]       = useState(null);
  const [events, setEvents]     = useState([]);
  const [summary, setSummary]   = useState({ pending: 0, approved: 0, rejected: 0 });
  const [tab, setTab]           = useState('pending');
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([adminApi.me(), adminApi.getEvents()])
      .then(([adminRes, eventsRes]) => {
        setAdmin(adminRes.data);
        setEvents(eventsRes.data);
        setSummary(eventsRes.summary);
      })
      .catch(e => showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (event) => {
    setActionId(event.id);
    try {
      const r = await adminApi.approve(event.id);
      showToast(r.message);
      fetchData();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setActionId(null);
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    setActionId(rejectTarget.id);
    try {
      const r = await adminApi.reject(rejectTarget.id, reason);
      showToast(r.message, 'info');
      setRejectTarget(null);
      fetchData();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setActionId(null);
    }
  };

  const visibleEvents = tab === 'all'
    ? events
    : events.filter(e => e.status === tab);

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div role="alert" style={{
          ...p.toast,
          background: toast.type === 'error' ? 'var(--danger)'
            : toast.type === 'info' ? 'var(--primary)'
            : 'var(--success)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          event={rejectTarget}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
          loading={!!actionId}
        />
      )}

      {/* Header */}
      <div style={p.header}>
        <div>
          <div style={p.adminBadge}>🛡️ Admin Panel</div>
          <h1 style={p.heading}>Event Review Dashboard</h1>
          {admin && (
            <p style={p.subheading}>
              Signed in as <strong>{admin.name}</strong> · {admin.title}
            </p>
          )}
        </div>
        <button style={p.refreshBtn} onClick={fetchData} aria-label="Refresh dashboard">
          ↻ Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div style={p.summaryGrid} role="region" aria-label="Summary statistics">
        {[
          { label: 'Pending Review', value: summary.pending,  color: '#F59E0B', bg: '#FEF3C7', icon: '⏳' },
          { label: 'Approved',       value: summary.approved, color: '#10B981', bg: '#ECFDF5', icon: '✅' },
          { label: 'Rejected',       value: summary.rejected, color: '#EF4444', bg: '#FEF2F2', icon: '❌' },
          { label: 'Total Events',   value: summary.pending + summary.approved + summary.rejected, color: 'var(--primary)', bg: 'var(--primary-light)', icon: '📋' },
        ].map(s => (
          <div key={s.label} style={{ ...p.summaryCard, background: s.bg, borderColor: s.color + '33' }}>
            <span style={p.summaryIcon}>{s.icon}</span>
            <div>
              <p style={{ ...p.summaryValue, color: s.color }}>{s.value}</p>
              <p style={p.summaryLabel}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={p.tabs} role="tablist" aria-label="Filter events by status">
        {STATUS_TABS.map(t => {
          const count = t === 'all'
            ? summary.pending + summary.approved + summary.rejected
            : summary[t] ?? 0;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              style={{ ...p.tab, ...(tab === t ? p.tabActive : {}) }}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span style={{ ...p.tabCount, ...(tab === t ? p.tabCountActive : {}) }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div style={p.center}>
          <div style={p.spinner} role="status" aria-label="Loading events" />
          <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Loading events…</p>
        </div>
      ) : visibleEvents.length === 0 ? (
        <div style={p.empty}>
          <p style={{ fontSize: 40 }}>
            {tab === 'pending' ? '🎉' : tab === 'approved' ? '✅' : '📭'}
          </p>
          <p style={{ fontWeight: 600, marginTop: 12 }}>
            {tab === 'pending' ? 'No events pending review' : `No ${tab} events`}
          </p>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            {tab === 'pending' ? 'All caught up! Check back when students submit new events.' : ''}
          </p>
        </div>
      ) : (
        <div style={p.list} role="list" aria-label={`${tab} events`}>
          {visibleEvents.map(event => (
            <div key={event.id} role="listitem">
              <ReviewCard
                event={event}
                onApprove={handleApprove}
                onReject={setRejectTarget}
                actionId={actionId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const p = {
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  adminBadge:    { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1E1B4B', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 8 },
  heading:       { fontSize: 28, fontWeight: 800 },
  subheading:    { color: 'var(--text-muted)', marginTop: 4 },
  refreshBtn:    { padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontWeight: 500, fontSize: 13 },
  summaryGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 },
  summaryCard:   { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 'var(--radius)', border: '1px solid', boxShadow: 'var(--shadow)' },
  summaryIcon:   { fontSize: 28 },
  summaryValue:  { fontSize: 28, fontWeight: 800, lineHeight: 1 },
  summaryLabel:  { fontSize: 13, color: 'var(--text-muted)', marginTop: 2 },
  tabs:          { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' },
  tab:           { padding: '10px 16px', border: 'none', background: 'none', fontWeight: 600, fontSize: 14, color: 'var(--text-muted)', borderBottom: '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  tabActive:     { color: 'var(--primary)', borderBottom: '2px solid var(--primary)' },
  tabCount:      { background: 'var(--border)', color: 'var(--text-muted)', borderRadius: 20, padding: '1px 8px', fontSize: 12 },
  tabCountActive:{ background: 'var(--primary-light)', color: 'var(--primary)' },
  center:        { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0' },
  spinner:       { width: 36, height: 36, border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin .7s linear infinite' },
  empty:         { textAlign: 'center', padding: '64px 0' },
  list:          { display: 'flex', flexDirection: 'column', gap: 16 },
  toast:         { position: 'fixed', bottom: 24, right: 24, color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 999, boxShadow: 'var(--shadow-lg)', maxWidth: 380 },
};

const c = {
  card:          { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', display: 'flex', boxShadow: 'var(--shadow)' },
  strip:         { width: 8, flexShrink: 0 },
  body:          { flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 },
  topRow:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  titleGroup:    { flex: 1 },
  statusPill:    { display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 },
  title:         { fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 },
  meta:          { fontSize: 13, color: 'var(--text-muted)', marginTop: 4 },
  category:      { fontWeight: 600, color: 'var(--primary)' },
  submittedCol:  { textAlign: 'right', flexShrink: 0 },
  submittedLabel:{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: .5 },
  submittedTime: { fontSize: 15, fontWeight: 700, color: 'var(--text)', marginTop: 2 },
  submittedDate: { fontSize: 12, color: 'var(--text-muted)' },
  details:       { display: 'flex', flexWrap: 'wrap', gap: '6px 20px' },
  detail:        { fontSize: 13, color: 'var(--text-muted)' },
  description:   { fontSize: 14, color: 'var(--text)', lineHeight: 1.6, background: 'var(--bg)', padding: '10px 14px', borderRadius: 8 },
  rejectionBox:  { fontSize: 13, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', color: '#991B1B' },
  actions:       { display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 4 },
  viewBtn:       { padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontWeight: 500, fontSize: 13 },
  approveBtn:    { padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--success)', color: '#fff', fontWeight: 700, fontSize: 13 },
  rejectBtn:     { padding: '8px 20px', borderRadius: 8, border: '1px solid var(--danger)', background: '#fff', color: 'var(--danger)', fontWeight: 700, fontSize: 13 },
  loadingBtn:    { opacity: 0.6, cursor: 'not-allowed' },
};

const m = {
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 },
  modal:      { background: '#fff', borderRadius: 'var(--radius)', padding: 28, maxWidth: 520, width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,.2)', display: 'flex', flexDirection: 'column', gap: 16 },
  title:      { fontSize: 20, fontWeight: 800 },
  subtitle:   { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 },
  label:      { fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 },
  presets:    { display: 'flex', flexDirection: 'column', gap: 6 },
  preset:     { textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13, cursor: 'pointer' },
  presetActive: { borderColor: 'var(--primary)', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600 },
  textarea:   { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, resize: 'vertical', minHeight: 80, outline: 'none' },
  actions:    { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  cancelBtn:  { padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontWeight: 600, fontSize: 14 },
  rejectBtn:  { padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--danger)', color: '#fff', fontWeight: 700, fontSize: 14 },
  disabledBtn:{ opacity: 0.5, cursor: 'not-allowed' },
};
