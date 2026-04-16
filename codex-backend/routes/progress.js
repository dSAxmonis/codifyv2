/**
 * GET    /api/progress           - get current user's solved questions
 * POST   /api/progress/:questionId - mark question solved
 * DELETE /api/progress/:questionId - unmark question
 */
const express  = require('express');
const router   = express.Router();
const { Progress } = require('../models/index');
const User     = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// GET /api/progress
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const progress = await Progress.find({ userId: req.auth.userId, isSolved: true })
      .populate('questionId', 'name difficulty company topics')
      .sort({ solvedAt: -1 });

    res.json({
      userId: req.auth.userId,
      count: progress.length,
      solved: progress,
    });
  } catch (err) { next(err); }
});

// POST /api/progress/:questionId
router.post('/:questionId', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { questionId } = req.params;

    const existing = await Progress.findOne({ userId, questionId });
    if (existing) {
      existing.isSolved = true;
      existing.solvedAt = new Date();
      await existing.save();
    } else {
      await Progress.create({ userId, questionId, isSolved: true });
      // Update user's total solved count
      await User.findOneAndUpdate({ clerkId: userId }, { $inc: { questionsSolved: 1 } });
    }

    res.json({ success: true, questionId });
  } catch (err) { next(err); }
});

// DELETE /api/progress/:questionId
router.delete('/:questionId', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { questionId } = req.params;

    const doc = await Progress.findOne({ userId, questionId });
    if (doc && doc.isSolved) {
      doc.isSolved = false;
      await doc.save();
      await User.findOneAndUpdate({ clerkId: userId }, { $inc: { questionsSolved: -1 } });
    }

    res.json({ success: true, questionId });
  } catch (err) { next(err); }
});

module.exports = router;
