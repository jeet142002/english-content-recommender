# Deployment Guide

## Quick Start: Deploy in 15 Minutes

### 1. Get TMDB API Keys
1. Go to [TMDB](https://www.themoviedb.org/settings/api)
2. Get API Key (v3 auth) and API Read Access Token (v4 auth)
3. Optional: Get [OMDB API Key](http://www.omdbapi.com/)

### 2. Deploy Backend (Railway)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Environment Variables for Railway:**
- `TMDB_API_KEY=your_key_here`
- `TMDB_API_TOKEN=your_token_here`
- `OMDB_API_KEY=your_omdb_key` (optional)
- `DATABASE_URL=postgresql://...` (auto-created)

### 3. Deploy Frontend (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Environment Variables for Vercel:**
- `NEXT_PUBLIC_API_URL=https://your-app.railway.app`

### 4. Update Data
```bash
# Run initial data import
python scripts/update-tmdb-data.py

# Or set up GitHub Actions (see scripts/github-actions-update.yml)
```

---

## Mobile App Experience (PWA)

Your deployed site will work like a mobile app:

1. **On iOS Safari:** Tap "Share" → "Add to Home Screen"
2. **On Android Chrome:** Tap "Install" in address bar
3. **Features:** 
   - Works offline (cached data)
   - Fullscreen mode
   - No browser UI
   - Push notifications possible

---

## Automated Updates

### Option 1: GitHub Actions (Recommended)
1. Push to GitHub
2. Add secrets in GitHub repo settings:
   - `TMDB_API_KEY`
   - `TMDB_API_TOKEN` 
   - `OMDB_API_KEY`
3. Copy `scripts/github-actions-update.yml` to `.github/workflows/`
4. Updates run weekly automatically

### Option 2: Railway Cron Jobs
```bash
# In Railway dashboard, add cron job:
python scripts/update-tmdb-data.py
# Schedule: 0 2 * * 0 (weekly)
```

---

## Scaling Considerations

| Feature | Current | Production Ready |
|---------|---------|------------------|
| Database | JSON file | PostgreSQL |
| Updates | Manual | Automated |
| Users | Unlimited | Unlimited |
| Cost | Free tier | ~$10-30/month |

**For 1000+ daily users:**
- Upgrade to Railway Pro ($5/month)
- Add Redis for session caching
- Consider Cloudflare for CDN

---

## Troubleshooting

### Common Issues

**CORS Errors:**
```python
# In FastAPI main.py, add:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Image Loading:**
```javascript
// In next.config.js, ensure:
images: {
  domains: ['image.tmdb.org'],
  unoptimized: true
}
```

**Database Connection:**
```python
# Use environment variable:
DATABASE_URL = os.getenv("DATABASE_URL")
```

---

## Sharing Your App

**Direct Link:** `https://your-app.vercel.app`
**QR Code:** Generate from the URL
**Social:** Share link with "Add to Home Screen" instructions

Your friends can use it immediately without installing anything!
