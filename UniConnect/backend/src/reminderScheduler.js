/**
 * Reminder Scheduler
 *
 * Local equivalent of: EventBridge (cron) → Lambda → SQS → SNS
 *
 * Runs every minute and checks for events happening in ~24 hours or ~1 hour.
 * Pushes in-app notifications for any student who has RSVP'd.
 */
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const { events, rsvps, notifications } = require('./data/mockData');

const REMINDED_24H = new Set(); // track to avoid duplicate reminders
const REMINDED_1H  = new Set();

function checkReminders() {
  const now = new Date();

  events.forEach(event => {
    const eventDate = new Date(event.date);
    const msUntil = eventDate - now;
    const hoursUntil = msUntil / (1000 * 60 * 60);

    const confirmedRsvps = rsvps.filter(r => r.eventId === event.id && r.status === 'confirmed');

    // 24-hour reminder window: between 23h and 25h away
    if (hoursUntil > 23 && hoursUntil <= 25) {
      confirmedRsvps.forEach(rsvp => {
        const key = `${event.id}-${rsvp.studentId}-24h`;
        if (!REMINDED_24H.has(key)) {
          REMINDED_24H.add(key);
          notifications.push({
            id: uuidv4(),
            studentId: rsvp.studentId,
            type: 'reminder',
            message: `Reminder: "${event.title}" is tomorrow! Don't forget – ${event.location}.`,
            eventId: event.id,
            read: false,
            createdAt: new Date().toISOString(),
          });
          console.log(`[Scheduler] 24h reminder sent to ${rsvp.studentName} for "${event.title}"`);
        }
      });
    }

    // 1-hour reminder window: between 55 min and 65 min away
    if (hoursUntil > 0.916 && hoursUntil <= 1.083) {
      confirmedRsvps.forEach(rsvp => {
        const key = `${event.id}-${rsvp.studentId}-1h`;
        if (!REMINDED_1H.has(key)) {
          REMINDED_1H.add(key);
          notifications.push({
            id: uuidv4(),
            studentId: rsvp.studentId,
            type: 'reminder',
            message: `Starting soon! "${event.title}" begins in about 1 hour at ${event.location}.`,
            eventId: event.id,
            read: false,
            createdAt: new Date().toISOString(),
          });
          console.log(`[Scheduler] 1h reminder sent to ${rsvp.studentName} for "${event.title}"`);
        }
      });
    }
  });
}

function startScheduler() {
  // Run every minute (equivalent to EventBridge cron in production)
  cron.schedule('* * * * *', () => {
    console.log('[Scheduler] Checking reminders...');
    checkReminders();
  });

  console.log('[Scheduler] Reminder scheduler started (runs every minute)');
}

module.exports = { startScheduler };
