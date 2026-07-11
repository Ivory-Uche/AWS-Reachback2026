# UniConnect – University Club Event Platform

A full-stack prototype for a university event platform where students can browse events, RSVP, create events, and receive in-app reminders.

---

## Quick Start

You need **Node.js 18+** installed. Open two terminals.

### Terminal 1 – Backend API (port 4000)

```bash
cd UniConnect/backend
npm install
npm run dev
```

### Terminal 2 – Frontend (port 5173)

```bash
cd UniConnect/frontend
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Features

| Feature | Description |
|---|---|
| Browse Events | Home page shows all upcoming events with search and category filters |
| Event Detail | Full event page with date, location, capacity bar, and attendee list |
| RSVP | One-click RSVP with capacity enforcement; cancel anytime |
| Create Event | Form to publish new events with title, description, date, capacity, tags |
| My Events | Dashboard showing your RSVPs and events you've created |
| Notifications | In-app notification centre for RSVP confirmations and reminders |
| Reminders | Automatic 24h and 1h reminders for RSVP'd events (runs via cron) |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/events` | List events (filter: `?category=`, `?search=`, `?upcoming=true`) |
| GET | `/api/events/:id` | Get single event |
| POST | `/api/events` | Create event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |
| GET | `/api/rsvp` | Get my RSVPs |
| POST | `/api/rsvp/:eventId` | RSVP to event |
| DELETE | `/api/rsvp/:eventId` | Cancel RSVP |
| GET | `/api/notifications` | Get my notifications |
| PUT | `/api/notifications/:id/read` | Mark notification read |
| PUT | `/api/notifications/read-all` | Mark all read |
| GET | `/api/students/me` | Get current user |

---

## Project Structure

```
UniConnect/
├── ARCHITECTURE.md          # AWS architecture diagram + service justifications
├── backend/
│   └── src/
│       ├── index.js              # Express server entry point
│       ├── reminderScheduler.js  # node-cron reminder engine (replaces EventBridge)
│       ├── data/
│       │   └── mockData.js       # In-memory mock data (students, events, RSVPs)
│       └── routes/
│           ├── events.js         # Event CRUD with in-memory cache
│           ├── rsvp.js           # RSVP and cancellation
│           ├── notifications.js  # In-app notification centre
│           └── students.js       # Current user endpoint
└── frontend/
    └── src/
        ├── App.jsx               # Router, Navbar, context
        ├── services/api.js       # Fetch wrapper for all API calls
        ├── components/
        │   └── EventCard.jsx     # Reusable event card
        └── pages/
            ├── HomePage.jsx      # Event listing with search/filter
            ├── EventDetail.jsx   # Single event view + RSVP
            ├── CreateEvent.jsx   # Event creation form
            ├── MyEvents.jsx      # RSVPs + created events dashboard
            └── Notifications.jsx # Notification centre
```

---

## Mock Data

- **5 students** pre-seeded (current user is Amara Osei – `s1`)
- **8 events** across Academic, Social, Workshop, and Sports categories
- **10 pre-seeded RSVPs** across various students
- **2 pre-seeded notifications** for the current user

---

## AWS Architecture

See `ARCHITECTURE.md` for the full AWS production architecture diagram and service justification table.

### Local → AWS mapping

| Local | AWS Production |
|---|---|
| Vite dev server | S3 + CloudFront |
| Express router | API Gateway |
| Route handlers | AWS Lambda |
| In-memory JSON | DynamoDB |
| Node.js Map cache | ElastiCache (Redis) |
| node-cron | EventBridge Scheduler |
| Notification store | SNS → SQS |
| morgan logs | CloudWatch |
