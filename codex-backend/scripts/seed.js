/**
 * seed.js — Run once to migrate JSON data into MongoDB
 * Usage: node scripts/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Company  = require('../models/Company');
const Question = require('../models/Question');

const posts          = require('../data/posts.json');
const companyDetails = require('../data/company_details.json');
const questions      = require('../data/questions.json');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // ── Clear existing ──────────────────────────────────────────────────────────
  await Company.deleteMany({});
  await Question.deleteMany({});
  console.log('🗑  Cleared existing data');

  // ── Seed Companies ──────────────────────────────────────────────────────────
  const companyDocs = posts.map(post => {
    const detail = companyDetails.find(d => d.id === post.id) || {};
    return {
      name:            post.username || '',
      logo:            post.logo || detail.logo || '',
      category:        (post.category || '').replace('Category :', '').trim(),
      location:        (post.location || '').replace('Location :', '').trim(),
      cgpaCriteria:    parseFloat((post.CGPA_criteria || '0').replace(/[^0-9.]/g, '')) || 0,
      branchesAllowed: (post.branches || '').replace('Branches Allowed :', '').trim(),
      backlogsPolicy:  (post.backlogs || '').replace('Min Backlogs :', '').trim(),
      detailsOfTest:   detail.details_of_test || '',
      timeForTest:     detail.time_for_test || '',
      message:         detail.message || [],
      postedDate:      new Date(post.date || Date.now()),
      interviewExperiences: (detail.interview_experiences || []).map(exp => ({
        rounds: (exp.rounds || []).map(r => ({
          roundName: r.round_name || '',
          questions: r.questions || [],
        })),
        outcome: '',
        year: new Date().getFullYear(),
      })),
    };
  });

  const insertedCompanies = await Company.insertMany(companyDocs);
  console.log(`✅ Seeded ${insertedCompanies.length} companies`);

  // ── Seed Questions ──────────────────────────────────────────────────────────
  const questionDocs = questions.map(q => ({
    legacyId:            q.id,        
    name:                q.name || '',
    difficulty:          ['Easy','Medium','Hard'].includes(q.difficulty) ? q.difficulty : 'Medium',
    company:             q.company || '',
    rating:              q.rating || 0,
    topics:              Array.isArray(q.topics) ? q.topics : [],
    questionDescription: q.question_description || '',
    inputFormat:         q.input_format || '',
    outputFormat:        q.output_format || '',
    constraints:         q.constraints || '',
    timeComplexity:      q.time_complexity || '',
    spaceComplexity:     q.space_complexity || '',
    examples:            Array.isArray(q.examples) ? q.examples : [],
    testCases:           Array.isArray(q.test_cases) ? q.test_cases : [],
    extraTestCases:      Array.isArray(q.extra_test_cases) ? q.extra_test_cases : [],
    solutions:           Array.isArray(q.solutions) ? q.solutions : [],
    
  
  }));

  const insertedQuestions = await Question.insertMany(questionDocs);
  console.log(`✅ Seeded ${insertedQuestions.length} questions`);

  console.log('\n🎉 Migration complete!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
