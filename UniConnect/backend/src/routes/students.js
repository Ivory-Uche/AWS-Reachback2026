const express = require('express');
const { students, currentUser } = require('../data/mockData');

const router = express.Router();

// GET /api/students/me – get the current (mock) logged-in user
router.get('/me', (req, res) => {
  res.json({ success: true, data: currentUser });
});

// GET /api/students – list all students
router.get('/', (req, res) => {
  res.json({ success: true, data: students, total: students.length });
});

module.exports = router;
