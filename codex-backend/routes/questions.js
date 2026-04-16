/**
 * GET  /api/questions            - list (filters: difficulty, topic, company, search, page, limit)
 * GET  /api/questions/meta       - filter options
 * GET  /api/questions/:id        - single question
 * POST /api/questions            - create (protected)
 * PUT  /api/questions/:id        - update (protected)
 * DELETE /api/questions/:id      - delete (protected)
 * 
 */

const express  = require('express');
const router   = express.Router();
const Question = require('../models/Question');
const { requireAuth } = require('../middleware/auth');

// GET /api/questions
router.get('/', async (req, res, next) => {
  try {
    const { difficulty, topic, company, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (difficulty) query.difficulty = difficulty;
    if (topic)      query.topics = topic;
    if (company)    query.company = company;
    if (search)     query.$text = { $search: search };

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [questions, total] = await Promise.all([
      Question.find(query).select('-testCases -extraTestCases -solutions').skip(skip).limit(limitNum),
      Question.countDocuments(query),
    ]);

    res.json({ total, page: pageNum, limit: limitNum, questions });
  } catch (err) { next(err); }
});

// GET /api/questions/meta
router.get('/meta', async (req, res, next) => {
  try {
    const [topicsRaw, companiesRaw] = await Promise.all([
      Question.distinct('topics'),
      Question.distinct('company'),
    ]);
    res.json({
      topics:       topicsRaw.filter(Boolean).sort(),
      companies:    companiesRaw.filter(Boolean).sort(),
      difficulties: ['Easy', 'Medium', 'Hard'],
    });
  } catch (err) { next(err); }
});

// GET /api/questions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ error: 'Question not found' });
    res.json(q);
  } catch (err) { next(err); }
});

// POST /api/questions  (protected)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const q = await Question.create(req.body);
    res.status(201).json(q);
  } catch (err) { next(err); }
});

// PUT /api/questions/:id  (protected)
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!q) return res.status(404).json({ error: 'Question not found' });
    res.json(q);
  } catch (err) { next(err); }
});

// DELETE /api/questions/:id  (protected)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
