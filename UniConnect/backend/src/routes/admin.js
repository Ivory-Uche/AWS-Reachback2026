const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { events, notifications, adminUser } = require('../data/mockData');

const router = express.Router();

// GET /api/admin/me – admin profile
router.get('/me', (req, res) => {
  res.json({ success: true, data: adminUser });
});

// GET /api/admin/events – full event list with status filter for admin review queue
router.get('/events', (req, res) => {
  const { status } = req.query;

  let result = [...events].map(e => ({
    ...e,
    status: e.status || 'approved', // backwards compat for events without status
  }));

  if (status) {
    result = result.filter(e => e.status === status);
  }

  // Sort: pending first, then most recently submitted
  result.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const summary = {
    pending:  result.filter(e => e.status === 'pending').length,
    approved: result.filter(e => e.status === 'approved').length,
    rejected: result.filter(e => e.status === 'rejected').length,
  };

  res.json({ success: true, data: result, total: result.length, summary });
});

// PUT /api/admin/events/:id/approve
router.put('/events/:id/approve', (req, res) => {
  const idx = events.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Event not found' });

  const event = events[idx];
  if ((event.status || 'approved') !== 'pending') {
    return res.status(400).json({ success: false, message: `Event is already "${event.status || 'approved'}"` });
  }

  events[idx] = {
    ...event,
    status: 'approved',
    reviewedBy: adminUser.id,
    reviewedAt: new Date().toISOString(),
    rejectionReason: null,
  };

  // Notify organiser
  notifications.push({
    id: uuidv4(),
    studentId: event.organizerId,
    type: 'approval',
    message: `Your event "${event.title}" has been approved and is now live on UniConnect!`,
    eventId: event.id,
    read: false,
    createdAt: new Date().toISOString(),
  });

  console.log(`[Admin] Approved: "${event.title}" by ${adminUser.name}`);
  res.json({ success: true, data: events[idx], message: `"${event.title}" approved and published.` });
});

// PUT /api/admin/events/:id/reject
router.put('/events/:id/reject', (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, message: 'A rejection reason is required.' });
  }

  const idx = events.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Event not found' });

  const event = events[idx];
  if ((event.status || 'approved') !== 'pending') {
    return res.status(400).json({ success: false, message: `Event is already "${event.status || 'approved'}"` });
  }

  events[idx] = {
    ...event,
    status: 'rejected',
    reviewedBy: adminUser.id,
    reviewedAt: new Date().toISOString(),
    rejectionReason: reason.trim(),
  };

  // Notify organiser with reason
  notifications.push({
    id: uuidv4(),
    studentId: event.organizerId,
    type: 'rejection',
    message: `Your event "${event.title}" was not approved. Reason: ${reason.trim()}`,
    eventId: event.id,
    read: false,
    createdAt: new Date().toISOString(),
  });

  console.log(`[Admin] Rejected: "${event.title}" – ${reason}`);
  res.json({ success: true, data: events[idx], message: `"${event.title}" has been rejected.` });
});

module.exports = router;
