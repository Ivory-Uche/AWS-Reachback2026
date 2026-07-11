const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { events, rsvps, currentUser } = require('../data/mockData');

const router = express.Router();

// Simple in-process cache (replaces ElastiCache locally)
let cache = { events: null, cachedAt: null };
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

function isCacheValid() {
  return cache.events && cache.cachedAt && (Date.now() - cache.cachedAt < CACHE_TTL_MS);
}

function invalidateCache() {
  cache = { events: null, cachedAt: null };
}

// GET /api/events – list all APPROVED events with optional filters
router.get('/', (req, res) => {
  const { category, search, upcoming } = req.query;

  let result = isCacheValid() ? cache.events : [...events];

  if (!isCacheValid()) {
    cache = { events: [...events], cachedAt: Date.now() };
    result = cache.events;
  }

  // Only show approved events to students; treat missing status as approved (backwards compat)
  result = result.filter(e => !e.status || e.status === 'approved');

  // Filter by category
  if (category && category !== 'All') {
    result = result.filter(e => e.category === category);
  }

  // Filter by search term
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.club.toLowerCase().includes(q) ||
      e.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Only upcoming events
  if (upcoming === 'true') {
    result = result.filter(e => new Date(e.date) > new Date());
  }

  // Enrich with RSVP count and whether current user has RSVP'd
  const enriched = result.map(event => {
    const eventRsvps = rsvps.filter(r => r.eventId === event.id && r.status === 'confirmed');
    const userRsvp = rsvps.find(r => r.eventId === event.id && r.studentId === currentUser.id && r.status === 'confirmed');
    return {
      ...event,
      rsvpCount: eventRsvps.length,
      spotsLeft: event.capacity - eventRsvps.length,
      isRsvped: !!userRsvp,
    };
  });

  res.json({ success: true, data: enriched, total: enriched.length });
});

// GET /api/events/:id – single event detail
router.get('/:id', (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  const eventRsvps = rsvps.filter(r => r.eventId === event.id && r.status === 'confirmed');
  const userRsvp = rsvps.find(r => r.eventId === event.id && r.studentId === currentUser.id && r.status === 'confirmed');

  res.json({
    success: true,
    data: {
      ...event,
      rsvpCount: eventRsvps.length,
      spotsLeft: event.capacity - eventRsvps.length,
      isRsvped: !!userRsvp,
      attendees: eventRsvps.map(r => ({ name: r.studentName })),
    },
  });
});

// POST /api/events – create a new event (goes to pending, requires admin approval)
router.post('/', (req, res) => {
  const { title, description, category, location, date, endDate, capacity, club, tags } = req.body;

  if (!title || !description || !category || !location || !date || !capacity) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: title, description, category, location, date, capacity',
    });
  }

  const newEvent = {
    id: uuidv4(),
    title,
    description,
    category,
    location,
    date,
    endDate: endDate || date,
    capacity: Number(capacity),
    organizerId: currentUser.id,
    organizer: currentUser.name,
    club: club || 'Independent',
    image: category.toLowerCase(),
    tags: tags || [],
    status: 'pending',        // awaits admin approval
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    createdAt: new Date().toISOString(),
  };

  events.push(newEvent);
  invalidateCache();

  res.status(201).json({
    success: true,
    data: newEvent,
    message: 'Event submitted for admin review. It will appear publicly once approved.',
  });
});

// PUT /api/events/:id – update an event
router.put('/:id', (req, res) => {
  const idx = events.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Event not found' });

  if (events[idx].organizerId !== currentUser.id) {
    return res.status(403).json({ success: false, message: 'Only the event organizer can edit this event' });
  }

  events[idx] = { ...events[idx], ...req.body, id: events[idx].id };
  invalidateCache();

  res.json({ success: true, data: events[idx], message: 'Event updated' });
});

// DELETE /api/events/:id – delete an event
router.delete('/:id', (req, res) => {
  const idx = events.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Event not found' });

  if (events[idx].organizerId !== currentUser.id) {
    return res.status(403).json({ success: false, message: 'Only the event organizer can delete this event' });
  }

  events.splice(idx, 1);
  invalidateCache();

  res.json({ success: true, message: 'Event deleted' });
});

module.exports = router;
