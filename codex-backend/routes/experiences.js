/**
 * GET  /api/experiences              - all experiences (public)
 * GET  /api/experiences/:companyId   - experiences for a company
 * POST /api/experiences              - submit experience (protected)
 * DELETE /api/experiences/:id        - delete own experience (protected)
 */
const express  = require('express');
const router   = express.Router();
const Company  = require('../models/Company');
const { requireAuth } = require('../middleware/auth');

// GET /api/experiences
router.get('/', async (req, res, next) => {
  try {
    const companies = await Company.find({ 'interviewExperiences.0': { $exists: true } })
      .select('name logo interviewExperiences category');
    res.json(companies);
  } catch (err) { next(err); }
});

// GET /api/experiences/:companyId
router.get('/:companyId', async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.companyId)
      .select('name logo interviewExperiences');
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company.interviewExperiences);
  } catch (err) { next(err); }
});

// POST /api/experiences/:companyId  (protected)
router.post('/:companyId', requireAuth, async (req, res, next) => {
  try {
    const { rounds, outcome, year } = req.body;
    if (!rounds || !Array.isArray(rounds)) {
      return res.status(400).json({ error: 'rounds array is required' });
    }

    const company = await Company.findByIdAndUpdate(
      req.params.companyId,
      { $push: { interviewExperiences: { rounds, outcome, year, userId: req.auth.userId } } },
      { new: true }
    );
    if (!company) return res.status(404).json({ error: 'Company not found' });

    res.status(201).json({ success: true });
  } catch (err) { next(err); }
});

// DELETE /api/experiences/:companyId/:expId  (protected)
router.delete('/:companyId/:expId', requireAuth, async (req, res, next) => {
  try {
    await Company.findByIdAndUpdate(
      req.params.companyId,
      { $pull: { interviewExperiences: { _id: req.params.expId } } }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
