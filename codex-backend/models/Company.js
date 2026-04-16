const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name:            { type: String, required: true },
  logo:            { type: String, default: '' },
  category:        { type: String, default: '' },   // SDE Intern / FTE
  location:        { type: String, default: '' },
  cgpaCriteria:    { type: Number, default: 0 },
  branchesAllowed: { type: String, default: '' },
  backlogsPolicy:  { type: String, default: '' },
  detailsOfTest:   { type: String, default: '' },
  timeForTest:     { type: String, default: '' },
  message:         [{ type: String }],
  postedDate:      { type: Date, default: Date.now },
  interviewExperiences: [{
    rounds: [{
      roundName:  { type: String },
      questions:  [{ type: String }],
    }],
    outcome: { type: String, enum: ['Selected', 'Rejected', ''], default: '' },
    year:    { type: Number },
  }],
}, { timestamps: true });

companySchema.index({ name: 'text' });

module.exports = mongoose.model('Company', companySchema);
