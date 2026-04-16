const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkId:          { type: String, required: true, unique: true },
  email:            { type: String, required: true },
  fullName:         { type: String, default: '' },
  username:         { type: String, default: '' },
  leetcodeProfile:  { type: String, default: '' },
  codeforcesProfile:{ type: String, default: '' },
  upi:              { type: String, default: '' },
  dob:              { type: Date },
  isMember:         { type: Boolean, default: false },
  memberSince:      { type: Date },
  questionsSolved:  { type: Number, default: 0 },
  streak:           { type: Number, default: 0 },
  lastActive:       { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
