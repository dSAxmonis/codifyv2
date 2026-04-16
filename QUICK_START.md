# ⚡ Quick Start Guide - Codify

## What Was Fixed?
1. **CodeCast** - Complete component rewrite ✅
2. **Backend Server** - Uncommented & Socket.IO added ✅  
3. **All Routes** - Properly mounted & working ✅

## 🏃 Get Running in 2 Minutes

### Terminal 1 - Backend
```bash
cd codex-backend
npm install  # Only first time
npm start
# Should see: 🚀 Codify backend running on port 5000 (Socket.IO enabled)
```

### Terminal 2 - Frontend
```bash
cd codex
npm install  # Only first time
npm start
# Automatically opens http://localhost:3000
```

## 🎯 Test Each Feature

### 1. **CodeCast** (Live 1v1 Battles)
```
1. Go to http://localhost:3000/home
2. Click/Navigate to /codecast
3. Pick question + language → Create Room
4. Note the room code (e.g., A3F9B2C1)
5. Open incognito tab → http://localhost:3000/codecast
6. Paste code → Join Room
7. Start coding! Both users see same question
8. Hit "Run Tests" then "Submit"
9. See battle results
```

### 2. **IntelliCode** (Practice)
```
1. Go to http://localhost:3000/intellicode
2. See all OA questions
3. Filter by difficulty/topic/company
4. Click question
5. Write code + Run/Submit
```

### 3. **PataKaro** (Company Archives)
```
1. Go to http://localhost:3000/patakaro
2. See company archives
3. Search/filter companies
4. View company details + OA history
```

## 🔧 Environment Setup

Create `.env` in `codex-backend/`:
```
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/codify
CLERK_SECRET_KEY=sk_test_xxxxx
FRONTEND_URL=http://localhost:3000
```

## 📱 Project URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health Check: http://localhost:5000/health
- Questions API: http://localhost:5000/api/questions

## ✅ Verify Everything Works
```bash
# Terminal 3 - Run these checks:
curl http://localhost:5000/health  # Should return status: ok

# Create room
curl http://localhost:5000/api/questions  # Should return questions array

# Check socket connection
# Open browser console in CodeCast page, should see Socket.IO messages
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check `node --version` (need v18+) |
| CORS error | Set FRONTEND_URL in backend .env |
| MongoDB connection fails | Verify MONGODB_URI is correct |
| Socket.IO not connecting | Check backend logs for "Socket.IO enabled" |
| Questions not loading | Verify `/api/questions` returns data |

## 🚀 Deploy (Later)
```bash
# Backend to Vercel
cd codex-backend
vercel deploy --prod

# Frontend to Vercel (update API URL first)
cd ../codex
vercel deploy --prod
```

## 📚 Documentation
- `SETUP_AND_TESTING.md` - Detailed setup guide
- `PROJECT_COMPLETION.md` - Full completion report
- `CodeCast.jsx` - Comments explain each section
- `server.js` - Comments explain each route

---

**You're all set! 🎉**

Start backends → Open http://localhost:3000 → Enjoy!
