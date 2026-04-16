/**
 * POST /api/feedback   - submit feedback (public)
 * GET  /api/feedback   - get all feedback (protected — admin only)
 */
const express  = require('express');
const router   = express.Router();
const { Feedback } = require('../models/index');
const { requireAuth } = require('../middleware/auth');

// POST /api/feedback
router.post('/', async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email and message are required' });
    }
    const fb = await Feedback.create({ name, email, message });
    res.status(201).json({ success: true, id: fb._id });
  } catch (err) { next(err); }
});

// GET /api/feedback  (protected)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).limit(100);
    res.json(feedbacks);
  } catch (err) { next(err); }
});

module.exports = router;
