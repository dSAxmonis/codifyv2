/**
 * GET  /api/submissions              - get current user's submissions
 * GET  /api/submissions/:questionId  - submissions for a specific question
 * POST /api/submissions              - save a submission
 */
const express  = require('express');
const router   = express.Router();
const { Submission } = require('../models/index');
const { requireAuth } = require('../middleware/auth');

// GET /api/submissions
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const [submissions, total] = await Promise.all([
      Submission.find({ userId: req.auth.userId })
        .populate('questionId', 'name difficulty company')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Submission.countDocuments({ userId: req.auth.userId }),
    ]);

    res.json({ total, page: pageNum, limit: limitNum, submissions });
  } catch (err) { next(err); }
});

// GET /api/submissions/:questionId
router.get('/:questionId', requireAuth, async (req, res, next) => {
  try {
    const submissions = await Submission.find({
      userId: req.auth.userId,
      questionId: req.params.questionId,
    }).sort({ createdAt: -1 }).limit(10);

    res.json(submissions);
  } catch (err) { next(err); }
});

// POST /api/submissions
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { questionId, language, code, verdict, execTimeMs, output } = req.body;

    if (!questionId || !language || !code || !verdict) {
      return res.status(400).json({ error: 'questionId, language, code, verdict are required' });
    }

    const submission = await Submission.create({
      userId: req.auth.userId,
      questionId, language, code, verdict,
      execTimeMs: execTimeMs || 0,
      output: output || '',
    });

    res.status(201).json(submission);
  } catch (err) { next(err); }
});

module.exports = router;
