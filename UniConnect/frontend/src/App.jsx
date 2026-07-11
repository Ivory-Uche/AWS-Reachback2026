import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { notificationsApi, studentsApi } from './services/api';

import HomePage        from './pages/HomePage';
import EventDetail     from './pages/EventDetail';
import CreateEvent     from './pages/CreateEvent';
import MyEvents        from './pages/MyEvents';
import Notifications   from './pages/Notifications';
import AdminDashboard  from './pages/AdminDashboard';

// ─── App Context ──────────────────────────────────────────────────────────────
export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

// ─── Icons ────────────────────────────────────────────────────────────────────
function BellIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ user, unreadCount, onNotifClick }) {
  return (
    <nav style={styles.nav}>
      <div className="container" style={styles.navInner}>

        {/* Logo */}
        <NavLink to="/" style={styles.logo}>
          <span style={styles.logoIcon}>🎓</span>
          <span>UniConnect</span>
        </NavLink>

        {/* Nav links */}
        <div style={styles.navLinks}>
          <NavLink
            to="/" end
            style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })}
          >
            Events
          </NavLink>
          <NavLink
            to="/my-events"
            style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })}
          >
            My Events
          </NavLink>

          {/* Admin link — visually distinct */}
          <NavLink
            to="/admin"
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.adminLinkActive : styles.adminLink),
            })}
            aria-label="Admin dashboard"
          >
            🛡️ Admin
          </NavLink>

          <NavLink to="/create" style={styles.createBtn}>
            + Create Event
          </NavLink>
        </div>

        {/* Right side */}
        <div style={styles.navRight}>
          {/* Notification bell */}
          <button
            style={styles.bellBtn}
            onClick={onNotifClick}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span style={styles.badge} aria-live="polite">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          {user && (
            <div
              style={styles.avatar}
              title={user.name}
              aria-label={`Logged in as ${user.name}`}
            >
              {user.avatar}
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]          = useState(null);
  const [unreadCount, setUnread] = useState(0);
  const navigate                 = useNavigate();

  useEffect(() => {
    studentsApi.me().then(r => setUser(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchUnread = () => {
      notificationsApi.getAll()
        .then(r => setUnread(r.unreadCount))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  const refreshUnread = () => {
    notificationsApi.getAll().then(r => setUnread(r.unreadCount)).catch(() => {});
  };

  return (
    <AppContext.Provider value={{ user, refreshUnread }}>
      <Navbar
        user={user}
        unreadCount={unreadCount}
        onNotifClick={() => navigate('/notifications')}
      />
      <main style={styles.main}>
        <div className="container">
          <Routes>
            <Route path="/"              element={<HomePage />} />
            <Route path="/events/:id"    element={<EventDetail />} />
            <Route path="/create"        element={<CreateEvent />} />
            <Route path="/my-events"     element={<MyEvents />} />
            <Route path="/notifications" element={<Notifications onRead={refreshUnread} />} />
            <Route path="/admin"         element={<AdminDashboard />} />
          </Routes>
        </div>
      </main>
    </AppContext.Provider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  nav: {
    background: '#fff',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: 'var(--shadow)',
  },
  navInner: {
    display: 'flex',
    alignItems: 'center',
    height: 64,
    gap: 8,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 700,
    fontSize: 20,
    color: 'var(--primary)',
    flexShrink: 0,
    marginRight: 8,
  },
  logoIcon: { fontSize: 24 },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  navLink: {
    padding: '6px 14px',
    borderRadius: 8,
    fontWeight: 500,
    fontSize: 15,
    color: 'var(--text-muted)',
    transition: 'all .15s',
  },
  navLinkActive: {
    color: 'var(--primary)',
    background: 'var(--primary-light)',
  },
  adminLink: {
    padding: '6px 14px',
    borderRadius: 8,
    fontWeight: 500,
    fontSize: 14,
    color: '#6B7280',
    transition: 'all .15s',
  },
  adminLinkActive: {
    padding: '6px 14px',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    color: '#fff',
    background: '#1E1B4B',
  },
  createBtn: {
    padding: '8px 16px',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    color: '#fff',
    background: 'var(--primary)',
    marginLeft: 4,
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginLeft: 'auto',
  },
  bellBtn: {
    position: 'relative',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    padding: 6,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    background: 'var(--danger)',
    color: '#fff',
    borderRadius: '99px',
    fontSize: 10,
    fontWeight: 700,
    minWidth: 16,
    height: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 3px',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'var(--primary)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    minHeight: 'calc(100vh - 64px)',
    paddingTop: 32,
    paddingBottom: 64,
  },
};
