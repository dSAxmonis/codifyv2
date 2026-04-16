const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  legacyId: { type: Number, default: null },
  name:                { type: String, required: true },
  difficulty:          { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  company:             { type: String, default: '' },
  rating:              { type: Number, default: 0 },
  topics:              [{ type: String }],
  questionDescription: { type: String, default: '' },
  inputFormat:         { type: String, default: '' },
  outputFormat:        { type: String, default: '' },
  constraints:         { type: String, default: '' },
  timeComplexity:      { type: String, default: '' },
  spaceComplexity:     { type: String, default: '' },
  examples:            [{ input: String, output: String, explanation: String }],
  testCases:           [{ input: String, output: String }],
  extraTestCases:      [{ input: String, output: String }],
  solutions:           [{ language: String, code: String }],
}, { timestamps: true });

questionSchema.index({ name: 'text' });
questionSchema.index({ difficulty: 1, company: 1 });

module.exports = mongoose.model('Question', questionSchema);
