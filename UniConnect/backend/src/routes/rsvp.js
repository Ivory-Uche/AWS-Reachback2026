const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { events, rsvps, currentUser, notifications } = require('../data/mockData');

const router = express.Router();

// GET /api/rsvp – get all RSVPs for the current user
router.get('/', (req, res) => {
  const userRsvps = rsvps.filter(r => r.studentId === currentUser.id && r.status === 'confirmed');
  const enriched = userRsvps.map(r => {
    const event = events.find(e => e.id === r.eventId);
    return { ...r, event };
  }).filter(r => r.event); // only include if event still exists

  res.json({ success: true, data: enriched, total: enriched.length });
});

// POST /api/rsvp/:eventId – RSVP to an event
router.post('/:eventId', (req, res) => {
  const { eventId } = req.params;

  const event = events.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  // Check if already RSVP'd
  const existing = rsvps.find(r => r.eventId === eventId && r.studentId === currentUser.id && r.status === 'confirmed');
  if (existing) {
    return res.status(409).json({ success: false, message: 'You have already RSVP\'d to this event' });
  }

  // Check capacity
  const confirmedCount = rsvps.filter(r => r.eventId === eventId && r.status === 'confirmed').length;
  if (confirmedCount >= event.capacity) {
    return res.status(400).json({ success: false, message: 'This event is at full capacity' });
  }

  const newRsvp = {
    id: uuidv4(),
    eventId,
    studentId: currentUser.id,
    studentName: currentUser.name,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };
  rsvps.push(newRsvp);

  // Create a confirmation notification (replaces SNS locally)
  notifications.push({
    id: uuidv4(),
    studentId: currentUser.id,
    type: 'confirmation',
    message: `You're going to "${event.title}" on ${new Date(event.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}!`,
    eventId,
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ success: true, data: newRsvp, message: `RSVP confirmed for "${event.title}"` });
});

// DELETE /api/rsvp/:eventId – cancel RSVP
router.delete('/:eventId', (req, res) => {
  const { eventId } = req.params;

  const idx = rsvps.findIndex(r => r.eventId === eventId && r.studentId === currentUser.id && r.status === 'confirmed');
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'No active RSVP found for this event' });
  }

  const event = events.find(e => e.id === eventId);

  // Mark as cancelled instead of deleting (keeps audit trail)
  rsvps[idx].status = 'cancelled';
  rsvps[idx].cancelledAt = new Date().toISOString();

  // Add cancellation notification
  if (event) {
    notifications.push({
      id: uuidv4(),
      studentId: currentUser.id,
      type: 'cancellation',
      message: `Your RSVP for "${event.title}" has been cancelled.`,
      eventId,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  res.json({ success: true, message: 'RSVP cancelled successfully' });
});

module.exports = router;
