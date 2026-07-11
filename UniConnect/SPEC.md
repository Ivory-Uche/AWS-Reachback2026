# UniConnect – Full Product Specification

**Version:** 1.0  
**Date:** July 2026  
**Project Type:** Local prototype (AWS-mapped architecture)  
**Built with:** Kiro IDE (AI-assisted development)  
**Repository:** https://github.com/Ivory-Uche/AWS-Reachback2026

---

## 1. Overview

UniConnect is a university club event platform that allows students to discover campus events, RSVP, receive reminders, and create their own events. All new events go through an admin approval workflow before becoming publicly visible.

### 1.1 Goals
- Give students a single place to discover what's happening on campus
- Allow any student to create and manage events
- Enforce quality control through an admin review process
- Deliver timely in-app reminders to RSVP'd attendees
- Demonstrate how a production-grade AWS architecture maps to a local prototype

### 1.2 Scope (Prototype)
- No authentication — current user is mocked as **Amara Osei (s1)**
- All data is in-memory (resets on server restart)
- Notifications are in-app only (no email or SMS)
- Single admin user — **Dr. Grace Mensah (admin1)**

---

## 2. User Roles

| Role | Description | Access |
|---|---|---|
| **Student** | Any university student | Browse events, RSVP, create events, view notifications |
| **Admin** | Student Affairs Administrator | Review queue, approve/reject events, view all events |

---

## 3. Data Model

### 3.1 Student
```
id          string   Unique identifier (e.g. 's1')
name        string   Full name
email       string   University email
avatar      string   2-letter initials
major       string   Academic department
```

### 3.2 Admin
```
id          string   Unique identifier ('admin1')
name        string   Full name
email       string   Admin email
avatar      string   2-letter initials
role        string   Always 'admin'
title       string   Job title
```

### 3.3 Event
```
id              string    Unique identifier
title           string    Event name
description     string    Full description
category        enum      Academic | Social | Workshop | Sports
location        string    Venue description
date            ISO8601   Start date/time
endDate         ISO8601   End date/time (defaults to date)
capacity        number    Maximum attendees
organizerId     string    Student ID of creator
organizer       string    Organiser display name
club            string    Organising club/society
image           string    Gradient key for visual styling
tags            string[]  Searchable tags
status          enum      pending | approved | rejected
reviewedBy      string?   Admin ID who reviewed
reviewedAt      ISO8601?  Review timestamp
rejectionReason string?   Reason if rejected
createdAt       ISO8601   Submission timestamp
```

### 3.4 RSVP
```
id          string    Unique identifier
eventId     string    Event reference
studentId   string    Student reference
studentName string    Denormalised display name
status      enum      confirmed | cancelled
createdAt   ISO8601   RSVP timestamp
cancelledAt ISO8601?  Cancellation timestamp
```

### 3.5 Notification
```
id          string    Unique identifier
studentId   string    Recipient student ID
type        enum      reminder | confirmation | cancellation | approval | rejection
message     string    Human-readable notification text
eventId     string    Related event reference
read        boolean   Read status
createdAt   ISO8601   Creation timestamp
```

---

## 4. Mock Data (Seed)

### Students (5)
| ID | Name | Major |
|---|---|---|
| s1 | Amara Osei *(current user)* | Computer Science |
| s2 | James Kimani | Business Admin |
| s3 | Priya Nair | Engineering |
| s4 | Tobias Müller | Design |
| s5 | Fatima Al-Zahra | Medicine |

### Events (10)
| ID | Title | Category | Status |
|---|---|---|---|
| e1 | Tech Innovation Summit | Academic | approved |
| e2 | Afrobeats Dance Night | Social | approved |
| e3 | Mental Health Awareness Workshop | Workshop | approved |
| e4 | Entrepreneurship Bootcamp | Academic | approved |
| e5 | Inter-Faculty Football Tournament | Sports | approved |
| e6 | UX Design Sprint | Workshop | approved |
| e7 | International Food Festival | Social | approved |
| e8 | Hackathon 24H: Build for Good | Academic | approved |
| e9 | Philosophy & Ethics Debate Night | Academic | **pending** |
| e10 | Campus Photography Walk | Social | **pending** |

### Pre-seeded RSVPs (10)
Various confirmed RSVPs across e1, e2, e3, e5, e7, e8 for different students.

### Pre-seeded Notifications (2)
Two unread reminder notifications for the current user (s1).

---

## 5. Features

### 5.1 Event Discovery (Home Page)
- Displays all **approved upcoming** events in a responsive card grid
- **Search** — filters by title, description, club name, and tags (300ms debounce)
- **Category filter** — pill tabs: All, Academic, Social, Workshop, Sports
- Each card shows: category, title, club, description preview, date, location, RSVP count/capacity
- RSVP status badges: "✓ RSVP'd" (green) or "Full" (red)
- RSVP and Cancel RSVP directly from card
- Result count displayed above grid
- Loading spinner, empty state, and error state with retry

### 5.2 Event Detail Page
- Full description with tags displayed as pills
- Attendee avatars (up to 8 shown, overflow as "+N")
- Capacity progress bar — colour changes: green → amber → red as capacity fills
- RSVP / Cancel RSVP button with real-time status update
- Reminder note shown when RSVP'd: "You'll receive reminders 24h and 1h before"
- Date/time formatting in British English locale

### 5.3 Create Event
- Form fields: Title, Description, Category, Club/Organisation, Location, Start Date & Time, End Date & Time (optional), Capacity, Tags
- Client-side validation with inline error messages
- Yellow approval notice banner: "All new events require admin approval"
- Submit button labelled "Submit for Review"
- On success: transitions to **Pending Confirmation Screen** (no page navigation)

#### Pending Confirmation Screen
- Shows event title, 3-step visual process tracker:
  1. ✅ Event submitted (complete)
  2. ⏳ Admin reviews (pending)
  3. 📣 Event goes live (pending)
- Info box explaining 24h review SLA
- Two action buttons: "Create Another Event" (resets form) / "Browse Events" (navigates home)

### 5.4 My Events
Two-tab dashboard:

**My RSVPs tab**
- Lists all confirmed RSVPs with event details, date, location, club
- "✓ Confirmed" badge per RSVP
- View and Cancel RSVP actions per row
- Empty state with "Browse Events" CTA

**Events I Created tab**
- Lists all events created by the current user (approved only, from public API)
- Shows RSVP count and spots remaining
- View and Delete actions per row
- Delete triggers browser confirm dialog
- Empty state with "Create an Event" CTA

### 5.5 Notifications
- Sorted by most recent first
- Unread count displayed in navbar bell badge (polls every 15 seconds)
- Notification types with distinct icons and colours:
  - 🔔 Reminder (amber)
  - ✅ Confirmation (green)
  - ❌ Cancellation (red)
  - 🎉 Approval (green)
  - ⛔ Rejection (red)
  - 📣 General (indigo)
- Unread items highlighted in primary-light blue background
- "Mark as read" per item, "Mark all as read" bulk action
- "View Event →" link per notification
- Unread dot indicator (top-right of item)

### 5.6 Admin Dashboard (`/admin`)

**Access:** Navbar "🛡️ Admin" link (dark navy when active)

**Summary Cards (4)**
- Pending Review (amber)
- Approved (green)
- Rejected (red)
- Total Events (indigo)

**Review Queue**
- Tabs: All | Pending | Approved | Rejected (with counts)
- Opens on "Pending" by default
- Each review card shows:
  - Colour strip (category gradient)
  - Status pill (colour-coded)
  - Event title, category, club, organiser
  - Submission time (relative) and date
  - Date, location, capacity, tags
  - Description preview (160 chars)
  - Rejection reason box (if rejected)

**Approve action**
- One-click approve
- Event status → `approved`, published immediately
- Organiser receives 🎉 approval notification

**Reject action**
- Opens modal with:
  - 5 preset rejection reasons (click to select)
  - Custom reason textarea
  - Confirm Rejection button (disabled until reason provided)
- Event status → `rejected`, reason stored
- Organiser receives ⛔ rejection notification with reason

**Refresh button** — re-fetches all data

---

## 6. API Reference

Base URL (local): `http://localhost:4000`

### Events
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/events` | List approved events | Student |
| GET | `/api/events/:id` | Get single event | Student |
| POST | `/api/events` | Create event (→ pending) | Student |
| PUT | `/api/events/:id` | Update event (organiser only) | Student |
| DELETE | `/api/events/:id` | Delete event (organiser only) | Student |

**GET /api/events query params:**
- `category` — filter by category name
- `search` — full-text search across title, description, club, tags
- `upcoming` — `true` to filter past events out

**POST /api/events required fields:**
`title`, `description`, `category`, `location`, `date`, `capacity`

### RSVP
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/rsvp` | Get current user's RSVPs |
| POST | `/api/rsvp/:eventId` | RSVP to event |
| DELETE | `/api/rsvp/:eventId` | Cancel RSVP |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | Get current user's notifications |
| PUT | `/api/notifications/:id/read` | Mark single notification read |
| PUT | `/api/notifications/read-all` | Mark all notifications read |

### Students
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/students/me` | Get current (mock) user |
| GET | `/api/students` | List all students |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/me` | Get admin profile |
| GET | `/api/admin/events` | All events (filter: `?status=pending`) |
| PUT | `/api/admin/events/:id/approve` | Approve event |
| PUT | `/api/admin/events/:id/reject` | Reject event (body: `{ reason }`) |

### Health
| Method | Endpoint |
|---|---|
| GET | `/health` |

---

## 7. Reminder Scheduler

The scheduler runs on server startup via `node-cron` (every minute). It is the local equivalent of **EventBridge → Lambda → SQS → SNS**.

**Logic:**
- For each approved event with confirmed RSVPs:
  - If event is 23–25 hours away → send 24h reminder notification
  - If event is 55–65 minutes away → send 1h reminder notification
- Deduplication via in-memory Sets (`REMINDED_24H`, `REMINDED_1H`)
- Notifications pushed to the in-memory store, visible immediately in the UI

---

## 8. Frontend Architecture

### Technology Stack
- **React 18** with functional components and hooks
- **React Router v6** — client-side routing
- **Vite 5** — dev server and bundler
- **CSS-in-JS** — inline style objects (no external CSS library)
- **Google Fonts** — Inter typeface

### Routing
| Path | Component | Description |
|---|---|---|
| `/` | HomePage | Event grid with search/filter |
| `/events/:id` | EventDetail | Single event with RSVP |
| `/create` | CreateEvent | Event submission form |
| `/my-events` | MyEvents | RSVPs + created events |
| `/notifications` | Notifications | Notification centre |
| `/admin` | AdminDashboard | Admin review queue |

### State Management
- `AppContext` — provides `user` and `refreshUnread` globally
- Local `useState` per page
- No external state library

### API Layer (`src/services/api.js`)
Thin fetch wrapper (`request()`) used by five named API groups:
- `eventsApi` — CRUD for events
- `rsvpApi` — RSVP and cancel
- `notificationsApi` — fetch and mark read
- `studentsApi` — current user
- `adminApi` — review queue management

### Design System (CSS Variables)
```
--primary:       #4F46E5   (indigo)
--primary-dark:  #3730A3
--primary-light: #EEF2FF
--accent:        #EC4899
--success:       #10B981
--warning:       #F59E0B
--danger:        #EF4444
--text:          #111827
--text-muted:    #6B7280
--border:        #E5E7EB
--bg:            #F9FAFB
--card:          #FFFFFF
--radius:        12px
--radius-sm:     8px
```

---

## 9. Backend Architecture

### Technology Stack
- **Node.js** with **Express 4**
- **morgan** — HTTP request logging (replaces CloudWatch)
- **cors** — configured for `http://localhost:5173`
- **node-cron** — reminder scheduler (replaces EventBridge)
- **uuid** — ID generation

### File Structure
```
backend/src/
├── index.js                  Entry point, middleware, route registration
├── reminderScheduler.js      Cron-based reminder engine
├── data/
│   └── mockData.js           In-memory data store (students, events, RSVPs, notifications)
└── routes/
    ├── events.js             Event CRUD + cache
    ├── rsvp.js               RSVP management
    ├── notifications.js      Notification centre
    ├── students.js           Student profile
    └── admin.js              Admin review workflow
```

### In-process Cache
`events.js` maintains a simple `{ events, cachedAt }` object with a 30-second TTL, invalidated on any write. This is the local equivalent of **ElastiCache (Redis)**.

---

## 10. AWS Production Architecture

The local prototype maps directly to AWS services as follows:

| Local | AWS Production |
|---|---|
| Vite dev server (`localhost:5173`) | Amazon S3 + CloudFront |
| Express router | Amazon API Gateway |
| Express route handlers | AWS Lambda (one function per domain) |
| In-memory JSON store | Amazon DynamoDB |
| Node.js Map cache | Amazon ElastiCache (Redis) |
| `node-cron` scheduler | Amazon EventBridge Scheduler |
| Notification store (REST) | Amazon SQS → Amazon SNS |
| `morgan` HTTP logger | Amazon CloudWatch |

See `ARCHITECTURE.md` for the full Mermaid diagram and service-by-service justification.

---

## 11. Changes Made During Development

### Phase 1 — Initial Build
- Project scaffolded at `UniConnect/backend` and `UniConnect/frontend`
- Backend: Express API with 4 routes (events, rsvp, notifications, students)
- Frontend: React + Vite with 5 pages (Home, EventDetail, CreateEvent, MyEvents, Notifications)
- 8 mock events, 5 mock students, 10 pre-seeded RSVPs
- `node-cron` reminder scheduler with 24h and 1h windows
- In-process 30s event listing cache
- Navbar with notification bell (15s polling), avatar, Create Event CTA

### Phase 2 — Admin Approval Workflow
The following changes were added after initial build:

**Data model changes:**
- Added `status` field to all events (`approved` | `pending` | `rejected`)
- Added `reviewedBy`, `reviewedAt`, `rejectionReason`, `createdAt` fields to events
- Added `adminUser` object (Dr. Grace Mensah) to mock data
- Added 2 pending seed events (e9 Philosophy Debate, e10 Photography Walk)
- Added `approval` and `rejection` notification types

**Backend changes:**
- `GET /api/events` — now filters out `pending` and `rejected` events from public listing
- `POST /api/events` — new events created with `status: 'pending'` instead of being immediately visible
- Added `/api/admin` route with 4 endpoints: `GET /me`, `GET /events`, `PUT /:id/approve`, `PUT /:id/reject`
- Approve action sets status → `approved`, pushes approval notification to organiser
- Reject action requires a reason, sets status → `rejected`, pushes rejection notification with reason
- Registered admin router in `index.js`

**Frontend changes:**
- `CreateEvent.jsx` — submit button changed to "Submit for Review", yellow approval notice added to form header, post-submit behaviour changed from navigating to event page (which would 404 since it's pending) to showing a `PendingConfirmation` component with 3-step tracker
- `AdminDashboard.jsx` — new page with summary cards, status tabs, review queue cards, approve button, reject modal with preset reasons and custom textarea
- `App.jsx` — imported `AdminDashboard`, added `/admin` route, added "🛡️ Admin" navbar link with dark navy active state
- `Notifications.jsx` — added `approval` (🎉) and `rejection` (⛔) to `TYPE_META`
- `api.js` — added `adminApi` with `me()`, `getEvents()`, `approve()`, `reject()` methods

### Phase 3 — Git & Repository Setup
- `.gitignore` created at `UniConnect/` level — excludes `node_modules/`, `dist/`, `.env`, `*.mp4`, log files
- Removed nested `.git` folder from `UniConnect/backend/` (created by npm on Windows)
- Resolved diverged history with `git pull --allow-unrelated-histories` to merge GitHub's auto-generated README
- Removed accidentally staged 132MB `.mp4` file from commit history using `git commit --amend`

---

## 12. Known Limitations (Prototype)

| Limitation | Production solution |
|---|---|
| All data lost on server restart | DynamoDB persistent storage |
| No authentication — current user is hardcoded | Amazon Cognito user pools |
| Admin accessible to all users (no role check) | Cognito groups + API Gateway authoriser |
| My Events only shows approved events (pending ones not visible to creator) | Separate `GET /api/events/my` endpoint that includes pending |
| Reminder scheduler runs every minute in dev | EventBridge hourly cron in production |
| No email/SMS — in-app only | SNS topics for email and push |
| Single-region | CloudFront global edge + multi-AZ DynamoDB |
| No pagination on event listing | DynamoDB pagination with LastEvaluatedKey |

---

## 13. How to Run

**Prerequisites:** Node.js 18+

**Terminal 1 — Backend (port 4000):**
```bash
cd UniConnect/backend
npm install
node src/index.js
```

**Terminal 2 — Frontend (port 5173):**
```bash
cd UniConnect/frontend
npm install
npm run dev
```

Open **http://localhost:5173**

Default user: **Amara Osei** (Computer Science, s1)  
Admin panel: **http://localhost:5173/admin**
