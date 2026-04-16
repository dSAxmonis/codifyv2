/**
 * GET  /api/users/me          - get current user profile
 * PUT  /api/users/me          - update profile
 * GET  /api/users/leaderboard - top users by questions solved
 */
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// GET /api/users/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// PUT /api/users/me
router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const allowed = ['fullName', 'username', 'leetcodeProfile', 'codeforcesProfile', 'upi', 'dob'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findOneAndUpdate(
      { clerkId: req.auth.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// GET /api/users/leaderboard
router.get('/leaderboard', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const users = await User.find({})
      .sort({ questionsSolved: -1, streak: -1 })
      .limit(limit)
      .select('fullName username questionsSolved streak clerkId');
    res.json(users);
  } catch (err) { next(err); }
});

module.exports = router;
