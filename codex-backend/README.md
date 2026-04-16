# Codify Backend

Production REST API for Codify — Node.js + Express + MongoDB + Clerk JWT Auth.

## Stack
- **Runtime**: Node.js 18+
- **Framework**: Express
- **Database**: MongoDB (via Mongoose)
- **Auth**: Clerk JWT verification
- **Deploy**: Vercel

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/sync | ✅ | Sync Clerk user to MongoDB |
| GET | /api/users/me | ✅ | Get own profile |
| PUT | /api/users/me | ✅ | Update profile |
| GET | /api/users/leaderboard | ❌ | Top users |
| GET | /api/companies | ❌ | List companies |
| GET | /api/companies/:id | ❌ | Company details |
| POST | /api/companies | ✅ | Create company |
| GET | /api/questions | ❌ | List questions (with filters) |
| GET | /api/questions/meta | ❌ | Filter options |
| GET | /api/questions/:id | ❌ | Single question |
| POST | /api/questions | ✅ | Create question |
| GET | /api/progress | ✅ | Get solved questions |
| POST | /api/progress/:questionId | ✅ | Mark solved |
| DELETE | /api/progress/:questionId | ✅ | Unmark solved |
| GET | /api/submissions | ✅ | My submissions |
| POST | /api/submissions | ✅ | Save submission |
| GET | /api/experiences | ❌ | All interview experiences |
| POST | /api/experiences/:companyId | ✅ | Submit experience |
| POST | /api/feedback | ❌ | Submit feedback |
| POST | /api/execute | ❌ | Run code (rate limited) |
| GET | /health | ❌ | Health check |

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env
# Fill in MONGODB_URI and CLERK_SECRET_KEY

# 3. Seed database from JSON files (run once)
node scripts/seed.js

# 4. Start dev server
npm run dev

# 5. Start production server
npm start
```

## Environment Variables

```
PORT=5000
MONGODB_URI=mongodb+srv://...
CLERK_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:3000
```

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env variables on Vercel dashboard or via CLI
vercel env add MONGODB_URI
vercel env add CLERK_SECRET_KEY
vercel env add FRONTEND_URL
```
