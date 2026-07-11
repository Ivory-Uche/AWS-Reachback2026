const express = require('express');
const { notifications, currentUser } = require('../data/mockData');

const router = express.Router();

// GET /api/notifications – get notifications for current user
router.get('/', (req, res) => {
  const userNotifs = notifications
    .filter(n => n.studentId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const unreadCount = userNotifs.filter(n => !n.read).length;

  res.json({ success: true, data: userNotifs, unreadCount });
});

// PUT /api/notifications/:id/read – mark a notification as read
router.put('/:id/read', (req, res) => {
  const notif = notifications.find(n => n.id === req.params.id && n.studentId === currentUser.id);
  if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });

  notif.read = true;
  res.json({ success: true, message: 'Marked as read' });
});

// PUT /api/notifications/read-all – mark all as read
router.put('/read-all', (req, res) => {
  notifications
    .filter(n => n.studentId === currentUser.id)
    .forEach(n => { n.read = true; });

  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = router;
