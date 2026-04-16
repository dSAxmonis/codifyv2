/**
 * POST /api/auth/sync
 * Called from frontend after login to ensure user exists in MongoDB.
 * Protected: requires valid Clerk token.
 */
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { requireAuth } = require('../middleware/auth');

router.post('/sync', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { email, fullName, username } = req.body;

    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      user = await User.create({ clerkId: userId, email, fullName, username });
    } else {
      // Update basic info if changed
      if (email)    user.email    = email;
      if (fullName) user.fullName = fullName;
      user.lastActive = new Date();
      await user.save();
    }

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
