import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi } from '../services/api';

const CATEGORIES = ['Academic', 'Social', 'Workshop', 'Sports'];

const INITIAL = {
  title: '', description: '', category: 'Academic',
  location: '', date: '', endDate: '', capacity: '', club: '', tags: '',
};

// ─── Pending confirmation screen shown after successful submission ─────────────
function PendingConfirmation({ eventTitle, onCreateAnother, onGoHome }) {
  return (
    <div style={ps.page} role="main" aria-live="polite">
      <div style={ps.card}>
        {/* Icon */}
        <div style={ps.iconWrap} aria-hidden="true">
          <span style={ps.icon}>⏳</span>
        </div>

        <h1 style={ps.heading}>Submitted for Review</h1>
        <p style={ps.eventName}>"{eventTitle}"</p>

        <p style={ps.body}>
          Your event has been submitted and is now waiting for admin approval.
          Once reviewed, it will appear on the UniConnect events page and
          you'll receive an in-app notification.
        </p>

        {/* Steps */}
        <div style={ps.steps} aria-label="Approval steps">
          {[
            { icon: '✅', text: 'Event submitted successfully', done: true },
            { icon: '⏳', text: 'Admin reviews your event',     done: false },
            { icon: '📣', text: 'Event goes live on UniConnect', done: false },
          ].map((step, i) => (
            <div key={i} style={{ ...ps.step, ...(step.done ? ps.stepDone : {}) }}>
              <span style={ps.stepIcon} aria-hidden="true">{step.icon}</span>
              <span style={ps.stepText}>{step.text}</span>
            </div>
          ))}
        </div>

        {/* Info box */}
        <div style={ps.infoBox} role="note">
          <strong>💡 What happens next?</strong>
          <p style={{ marginTop: 6, lineHeight: 1.6 }}>
            The admin team typically reviews events within 24 hours. You'll get a
            notification in your bell icon when the decision is made. If rejected,
            you'll receive a reason and can resubmit with changes.
          </p>
        </div>

        {/* Actions */}
        <div style={ps.actions}>
          <button style={ps.secondaryBtn} onClick={onCreateAnother}>
            + Create Another Event
          </button>
          <button style={ps.primaryBtn} onClick={onGoHome}>
            Browse Events
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main CreateEvent form ────────────────────────────────────────────────────
export default function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm]         = useState(INITIAL);
  const [errors, setErrors]     = useState({});
  const [submitting, setSub]    = useState(false);
  const [submitted, setSubmitted] = useState(null); // holds { title } after success
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Event title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.location.trim())    e.location    = 'Location is required';
    if (!form.date)               e.date        = 'Start date and time is required';
    if (!form.capacity || Number(form.capacity) < 1) e.capacity = 'Capacity must be at least 1';
    if (form.endDate && form.endDate < form.date)    e.endDate  = 'End date must be after start date';
    return e;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSub(true);
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      const r = await eventsApi.create(payload);
      // Show pending confirmation screen instead of navigating to the event
      setSubmitted({ title: r.data.title });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSub(false);
    }
  };

  // Show confirmation screen after successful submit
  if (submitted) {
    return (
      <PendingConfirmation
        eventTitle={submitted.title}
        onCreateAnother={() => { setSubmitted(null); setForm(INITIAL); }}
        onGoHome={() => navigate('/')}
      />
    );
  }

  const minDate = new Date().toISOString().slice(0, 16);

  return (
    <div style={s.page}>
      {toast && (
        <div role="alert" style={{ ...s.toast, background: 'var(--danger)' }}>
          {toast.msg}
        </div>
      )}

      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)} aria-label="Go back">← Back</button>
        <h1 style={s.heading}>Create New Event</h1>
        <p style={s.subheading}>Fill in the details below — your event will go live once approved by the admin team.</p>
        {/* Approval notice */}
        <div style={s.approvalNotice} role="note">
          🔔 All new events require admin approval before appearing publicly on UniConnect.
        </div>
      </div>

      <form onSubmit={handleSubmit} style={s.form} noValidate aria-label="Create event form">

        <Field label="Event Title *" error={errors.title} htmlFor="title">
          <input
            id="title" type="text" value={form.title}
            onChange={e => handleChange('title', e.target.value)}
            placeholder="e.g. Annual Tech Innovation Summit"
            style={{ ...s.input, ...(errors.title ? s.inputError : {}) }}
            aria-required="true"
          />
        </Field>

        <Field label="Description *" error={errors.description} htmlFor="description">
          <textarea
            id="description" value={form.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="What's this event about? Include any important details for attendees."
            rows={4}
            style={{ ...s.input, ...s.textarea, ...(errors.description ? s.inputError : {}) }}
            aria-required="true"
          />
        </Field>

        <div style={s.row}>
          <Field label="Category *" htmlFor="category" style={{ flex: 1 }}>
            <select
              id="category" value={form.category}
              onChange={e => handleChange('category', e.target.value)}
              style={s.input}
              aria-required="true"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Club / Organisation" htmlFor="club" style={{ flex: 1 }}>
            <input
              id="club" type="text" value={form.club}
              onChange={e => handleChange('club', e.target.value)}
              placeholder="e.g. Computer Science Society"
              style={s.input}
            />
          </Field>
        </div>

        <Field label="Location *" error={errors.location} htmlFor="location">
          <input
            id="location" type="text" value={form.location}
            onChange={e => handleChange('location', e.target.value)}
            placeholder="e.g. Main Auditorium, Block A"
            style={{ ...s.input, ...(errors.location ? s.inputError : {}) }}
            aria-required="true"
          />
        </Field>

        <div style={s.row}>
          <Field label="Start Date & Time *" error={errors.date} htmlFor="date" style={{ flex: 1 }}>
            <input
              id="date" type="datetime-local" value={form.date} min={minDate}
              onChange={e => handleChange('date', e.target.value)}
              style={{ ...s.input, ...(errors.date ? s.inputError : {}) }}
              aria-required="true"
            />
          </Field>
          <Field label="End Date & Time" error={errors.endDate} htmlFor="endDate" style={{ flex: 1 }}>
            <input
              id="endDate" type="datetime-local" value={form.endDate} min={form.date || minDate}
              onChange={e => handleChange('endDate', e.target.value)}
              style={{ ...s.input, ...(errors.endDate ? s.inputError : {}) }}
            />
          </Field>
        </div>

        <Field label="Capacity (max attendees) *" error={errors.capacity} htmlFor="capacity" style={{ maxWidth: 220 }}>
          <input
            id="capacity" type="number" value={form.capacity} min="1"
            onChange={e => handleChange('capacity', e.target.value)}
            placeholder="e.g. 100"
            style={{ ...s.input, ...(errors.capacity ? s.inputError : {}) }}
            aria-required="true"
          />
        </Field>

        <Field label="Tags (comma-separated)" htmlFor="tags">
          <input
            id="tags" type="text" value={form.tags}
            onChange={e => handleChange('tags', e.target.value)}
            placeholder="e.g. technology, networking, free-food"
            style={s.input}
            aria-describedby="tags-hint"
          />
          <p id="tags-hint" style={s.hint}>Separate tags with commas. Tags help students discover your event.</p>
        </Field>

        <div style={s.actions}>
          <button type="button" style={s.cancelBtn} onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" style={s.submitBtn} disabled={submitting} aria-busy={submitting}>
            {submitting ? 'Submitting…' : '📩 Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, htmlFor, children, style }) {
  return (
    <div style={{ ...fieldS.group, ...style }}>
      <label htmlFor={htmlFor} style={fieldS.label}>{label}</label>
      {children}
      {error && <p id={`${htmlFor}-error`} style={fieldS.error} role="alert">{error}</p>}
    </div>
  );
}

const fieldS = {
  group: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 600, color: 'var(--text)' },
  error: { fontSize: 13, color: 'var(--danger)' },
};

// ─── Form styles ──────────────────────────────────────────────────────────────
const s = {
  page:           { maxWidth: 720, margin: '0 auto' },
  header:         { marginBottom: 28 },
  heading:        { fontSize: 28, fontWeight: 800 },
  subheading:     { color: 'var(--text-muted)', marginTop: 4 },
  backBtn:        { background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 500, padding: 0, marginBottom: 12, fontSize: 14 },
  approvalNotice: { marginTop: 14, padding: '10px 16px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 13, color: '#92400E', fontWeight: 500 },
  form:           { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28, boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 20 },
  row:            { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  input:          { padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 14, outline: 'none', background: '#fff', width: '100%', transition: 'border-color .15s' },
  inputError:     { borderColor: 'var(--danger)' },
  textarea:       { resize: 'vertical', minHeight: 100 },
  hint:           { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  actions:        { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 20 },
  cancelBtn:      { padding: '10px 24px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: '#fff', fontWeight: 600, fontSize: 14, color: 'var(--text)' },
  submitBtn:      { padding: '10px 28px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 14 },
  toast:          { position: 'fixed', bottom: 24, right: 24, color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 999, boxShadow: 'var(--shadow-lg)' },
};

// ─── Pending confirmation styles ──────────────────────────────────────────────
const ps = {
  page:         { display: 'flex', justifyContent: 'center', paddingTop: 24 },
  card:         { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '40px 36px', maxWidth: 540, width: '100%', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' },
  iconWrap:     { width: 72, height: 72, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  icon:         { fontSize: 36 },
  heading:      { fontSize: 24, fontWeight: 800, color: 'var(--text)' },
  eventName:    { fontSize: 16, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '6px 16px', borderRadius: 8 },
  body:         { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 420 },
  steps:        { width: '100%', display: 'flex', flexDirection: 'column', gap: 10 },
  step:         { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 14 },
  stepDone:     { background: '#ECFDF5', borderColor: '#6EE7B7', color: '#065F46' },
  stepIcon:     { fontSize: 18, flexShrink: 0 },
  stepText:     { fontWeight: 500 },
  infoBox:      { width: '100%', background: 'var(--primary-light)', border: '1px solid #C7D2FE', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: 'var(--primary-dark)', textAlign: 'left' },
  actions:      { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', width: '100%', paddingTop: 4 },
  primaryBtn:   { padding: '11px 28px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 14 },
  secondaryBtn: { padding: '11px 24px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: '#fff', color: 'var(--text)', fontWeight: 600, fontSize: 14 },
};
