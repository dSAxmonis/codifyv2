/**
 * GET  /api/companies            - list companies (search, category, page)
 * GET  /api/companies/:id        - single company with questions
 * POST /api/companies            - create company (admin)
 * PUT  /api/companies/:id        - update company (admin)
 * DELETE /api/companies/:id      - delete company (admin)
 */
const express = require('express');
const router  = express.Router();
const Company = require('../models/Company');
const Question = require('../models/Question');
const { requireAuth } = require('../middleware/auth');

// GET /api/companies
router.get('/', async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search)   query.$text = { $search: search };
    if (category) query.category = { $regex: category, $options: 'i' };

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [companies, total] = await Promise.all([
      Company.find(query).select('-interviewExperiences').sort({ postedDate: -1 }).skip(skip).limit(limitNum),
      Company.countDocuments(query),
    ]);

    res.json({ total, page: pageNum, limit: limitNum, companies });
  } catch (err) { next(err); }
});

// GET /api/companies/:id
router.get('/:id', async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    // Attach related questions
    const questions = await Question.find({ company: company.name }).select('name difficulty topics rating');

    res.json({ ...company.toObject(), questions });
  } catch (err) { next(err); }
});

// POST /api/companies  (protected)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json(company);
  } catch (err) { next(err); }
});

// PUT /api/companies/:id  (protected)
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (err) { next(err); }
});

// DELETE /api/companies/:id  (protected)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
