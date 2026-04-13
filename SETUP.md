# Setup Guide - My Video Clipper

Complete step-by-step instructions to get My Video Clipper running locally and deployed to production.

## Prerequisites

Ensure you have:
- Node.js 18+
- npm
- Git
- GitHub account
- Supabase account (free tier available at supabase.com)
- Railway account (free tier available at railway.app)
- Vercel account (free tier available at vercel.com)

## Part 1: Local Development Setup

### Step 1: Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project:
   - Click "New Project"
   - Enter a project name: `my-video-clipper`
   - Choose a region close to you
   - Set a secure password
   - Click "Create new project"

3. Wait for the project to initialize (2-3 minutes)

4. Go to **Settings > API** and copy:
   - `Project URL` (save as `NEXT_PUBLIC_SUPABASE_URL`)
   - `anon public key` (save as `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role key` (save as `SUPABASE_SERVICE_ROLE_KEY`) ⚠️ Keep this secret!

### Step 2: Create Database Tables

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `backend/migrations/001_create_tables.sql`
4. Click **Run**
5. Verify tables are created:
   - `videos` table
   - `clips` table
   - `custom_watermarks` table

### Step 3: Create Storage Buckets

1. In Supabase, go to **Storage**
2. Click **Create a new bucket**
3. Create bucket `watermarks`:
   - Name: `watermarks`
   - Public: OFF (Private)
   - Click Create
4. Create bucket `public-watermark`:
   - Name: `public-watermark`
   - Public: ON (Public)
   - Click Create

5. Upload default watermark:
   - Click into `public` bucket
   - Click **Upload file**
   - Upload a watermark image (or create a simple one)
   - Save as `default-watermark.png`

### Step 4: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy example environment file
cp .env.example .env

# Edit .env with your Supabase credentials
# Update these variables:
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
nano .env  # or use your preferred editor

# Start development server
npm run dev

# Server should start on http://localhost:3001
# Test: curl http://localhost:3001/api/health
```

Expected output:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-04-06T..."
}
```

### Step 5: Frontend Setup

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
nano .env.local  # or use your preferred editor

# Start development server
npm run dev

# Frontend should start on http://localhost:3000
```

### Step 6: Test Locally

1. Open http://localhost:3000 in your browser
2. You should see the home page with all features
3. Click "Get Started" to go to upload page
4. Try uploading a test video (small file, < 100MB for testing)
5. Check backend logs for processing status

## Part 2: Deployment

### Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Authorize Railway to access your GitHub
5. Select `my-video-clipper` repository
6. Railway will automatically detect it as a Node.js project
7. Add environment variables:
   - Go to **Variables**
   - Add all variables from your `.env` file:
     - `PORT=3001`
     - `NODE_ENV=production`
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `TEMP_DIR=/tmp`
     - `VIDEOS_DIR=/tmp/videos`
     - `CLIPS_DIR=/tmp/clips`
     - `WATERMARKS_DIR=/tmp/watermarks`

8. Configure startup:
   - Go to **Settings > Deploy**
   - Root Directory: `backend`
   - Start Command: `npm start`

9. Click **Deploy**
10. Wait for deployment to complete
11. Copy the Railway URL (e.g., `https://api.railway.app`)
12. Save this URL - you'll need it for frontend

### Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **New Project**
3. Search for and select `my-video-clipper` repository
4. In the project import:
   - Framework Preset: **Next.js**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = (your Railway API URL from above)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

6. Click **Deploy**
7. Wait for deployment to complete (~3-5 minutes)
8. Copy the Vercel URL (e.g., `https://my-video-clipper.vercel.app`)

### Step 3: Verify Production Deployment

1. Go to your Vercel URL
2. Check that the home page loads correctly
3. Try uploading a video
4. Verify the backend processes the request

## Troubleshooting

### Backend won't start

**Error: "Cannot find module @supabase/supabase-js"**
```bash
cd backend
npm install --save @supabase/supabase-js
```

**Error: "SUPABASE_SERVICE_ROLE_KEY is missing"**
- Check that your `.env` file has the correct key
- Verify you copied it from Supabase Settings > API

### Frontend won't connect to backend

**Error: "Failed to upload video"**
- Check that the backend is running: `curl http://localhost:3001/api/health`
- Verify `NEXT_PUBLIC_API_URL` in `.env.local` is correct
- Check browser console for CORS errors

### Database tables not created

**Error: "relation 'videos' does not exist"**
- Go to Supabase SQL Editor
- Re-run the migration SQL from `backend/migrations/001_create_tables.sql`
- Check for syntax errors in the SQL

### Video upload fails

**Error: "File size exceeds maximum"**
- Max file size is 1.5GB
- Try with a smaller test video

**Error: "Invalid file type"**
- Only MP4, MOV, and WebM are supported
- Convert your video to one of these formats

### Storage bucket issues

**Error: "No such bucket: watermarks"**
- Create the buckets manually in Supabase UI:
  - Go to Storage
  - Create "watermarks" (Private) and "public" (Public) buckets

## Next Steps

1. Customize the application:
   - Edit watermark in `frontend/public/`
   - Modify colors in components
   - Add your branding

2. Optimize performance:
   - Configure CDN for static assets
   - Set up analytics
   - Monitor error rates

3. Add features:
   - User authentication (Supabase Auth)
   - Video history
   - Clip sharing
   - Advanced analytics

## Support

For issues:
1. Check the [README.md](README.md) for more information
2. Review error logs in your terminal
3. Check Supabase and Railway dashboards for service status
4. Create an issue on GitHub

---

**You're all set! Happy clipping! 🎬✨**
