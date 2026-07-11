const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const eventsRouter        = require('./routes/events');
const rsvpRouter          = require('./routes/rsvp');
const notificationsRouter = require('./routes/notifications');
const studentsRouter      = require('./routes/students');
const adminRouter         = require('./routes/admin');
const { startScheduler }  = require('./reminderScheduler');

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/events',        eventsRouter);
app.use('/api/rsvp',          rsvpRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/students',      studentsRouter);
app.use('/api/admin',         adminRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'UniConnect API', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎓 UniConnect API running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
  startScheduler();
});
