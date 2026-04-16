const mongoose = require('mongoose');

// ── Progress ──────────────────────────────────────────────────────────────────
const progressSchema = new mongoose.Schema({
  userId:     { type: String, required: true },   // Clerk user ID
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  isSolved:   { type: Boolean, default: true },
  solvedAt:   { type: Date, default: Date.now },
}, { timestamps: true });

progressSchema.index({ userId: 1, questionId: 1 }, { unique: true });

// ── Submission ────────────────────────────────────────────────────────────────
const submissionSchema = new mongoose.Schema({
  userId:       { type: String, required: true },
  questionId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  language:     { type: String, enum: ['cpp', 'python', 'java'], required: true },
  code:         { type: String, required: true },
  verdict:      { type: String, enum: ['AC', 'WA', 'TLE', 'CE', 'RE'], required: true },
  execTimeMs:   { type: Number, default: 0 },
  output:       { type: String, default: '' },
}, { timestamps: true });

submissionSchema.index({ userId: 1, questionId: 1 });

// ── Feedback ──────────────────────────────────────────────────────────────────
const feedbackSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: true });

module.exports = {
  Progress:   mongoose.model('Progress',   progressSchema),
  Submission: mongoose.model('Submission', submissionSchema),
  Feedback:   mongoose.model('Feedback',   feedbackSchema),
};
