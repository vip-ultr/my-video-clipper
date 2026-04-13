# My Video Clipper

An AI-powered livestream video clipper that automatically creates short-form clips from long-form content with professional editing capabilities.

## Features

- **🤖 AI Clip Detection** - Automatically identify high-engagement moments using sentiment analysis
- **✨ Subtitle Styling** - 3 professional subtitle styles with custom colors
- **🎬 Blur Effects** - Apply smooth blur to sensitive content
- **🏷️ Watermarks** - Add custom or default watermarks with position and opacity control
- **🎨 Aspect Ratio Converter** - Convert to vertical (9:16), horizontal (16:9), or square (1:1)
- **📊 Quality Settings** - Choose from low, medium, or high quality encoding
- **⚡ Fast Processing** - Optimized FFmpeg pipeline for quick clip generation

## Tech Stack

### Frontend
- **Framework**: Next.js 14 with React 18
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui, Lucide React Icons
- **State Management**: Zustand
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Railway /tmp (temporary), Supabase Storage (watermarks)
- **Video Processing**: FFmpeg
- **Transcription**: Faster Whisper
- **Analysis**: HuggingFace Sentiment

### Deployment
- **Frontend**: Vercel
- **Backend**: Railway

## Project Structure

```
my-video-clipper/
├── frontend/               # Next.js React application
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities and API client
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Zustand state stores
│   └── styles/            # CSS styles
│
├── backend/               # Express.js Node application
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── types/         # TypeScript interfaces
│   │   ├── utils/         # Utilities
│   │   └── jobs/          # Background jobs
│   └── dist/              # Compiled JavaScript
│
└── README.md              # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)
- Railway account (free tier with $5 credit)
- Vercel account (free tier)
- GitHub account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/vip-ultr/my-video-clipper.git
   cd my-video-clipper
   ```

2. **Setup Supabase**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Copy your project URL and API keys
   - Run the SQL migrations in `backend/.env.example` to create tables
   - Create storage buckets: `watermarks` (private) and `public-watermark` (public)

3. **Setup Backend**
   ```bash
   cd backend
   npm install

   # Copy and update .env file
   cp .env.example .env
   # Edit .env with your Supabase credentials

   # Start development server
   npm run dev
   # Runs on http://localhost:3001
   ```

4. **Setup Frontend**
   ```bash
   cd frontend
   npm install

   # Create .env.local
   cp .env.example .env.local
   # Edit with your API URL and Supabase keys

   # Start development server
   npm run dev
   # Runs on http://localhost:3000
   ```

5. **Open in browser**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## API Endpoints

### Upload
- `POST /api/upload` - Upload video file
- `POST /api/watermark/upload` - Upload custom watermark
- `GET /api/watermark/list` - Get custom watermarks
- `DELETE /api/watermark/:watermarkId` - Delete watermark

### Clips
- `POST /api/clips/create` - Create processed clip
- `GET /api/clips/video/:videoId` - Get clips for video

### Download
- `GET /api/download/:clipId` - Download clip file
- `GET /api/download/:clipId/info` - Get clip metadata

### Processing
- `GET /api/processing/:videoId` - Get processing status
- `POST /api/processing/:videoId/analyze` - Start video analysis

### Health
- `GET /api/health` - Health check

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (.env)
```
PORT=3001
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe
TEMP_DIR=/tmp
VIDEOS_DIR=/tmp/videos
CLIPS_DIR=/tmp/clips
WATERMARKS_DIR=/tmp/watermarks
HUGGINGFACE_API_KEY=your-key-optional
```

## Deployment

### Deploy to Vercel (Frontend)
1. Push to GitHub
2. Go to vercel.com and import the project
3. Set root directory to `./frontend`
4. Add environment variables
5. Deploy

### Deploy to Railway (Backend)
1. Push to GitHub
2. Go to railway.app and create new project
3. Connect GitHub repo
4. Set root directory to `./backend`
5. Add all environment variables
6. Set start command to `npm start`
7. Deploy

## Features Implemented

### ✅ Backend
- [x] Express.js server with TypeScript
- [x] Supabase integration (database + storage)
- [x] Video upload with multer
- [x] FFmpeg video processing pipeline
- [x] Watermark upload and management
- [x] Clip creation with all effects
- [x] Download streaming
- [x] Automatic temp file cleanup (1 hour)
- [x] Error handling and logging
- [x] Health check endpoint

### ✅ Frontend
- [x] Next.js 14 with App Router
- [x] Home page with hero + features
- [x] Upload page with drag-drop
- [x] Editor page with all controls
- [x] Video preview player
- [x] Subtitle editor
- [x] Blur controls
- [x] Watermark selector
- [x] Quality and aspect ratio settings
- [x] Progress indicators
- [x] Error handling
- [x] Responsive design (mobile + desktop)

### ✅ Components
- [x] Navigation bar
- [x] Button, Input UI components
- [x] Video upload area
- [x] Clip editor
- [x] Download view
- [x] Processing status
- [x] Feature cards

## File Limits

- **Video Upload**: 1.5GB max
- **Watermark Upload**: 5MB max
- **File Retention**: Automatic deletion after 1 hour

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimizations

- **FFmpeg**: Streaming-based processing
- **Video Encoding**: H.264 with CRF 23, 2500kbps
- **Audio Encoding**: AAC 96kbps
- **Cleanup Job**: Runs every 30 minutes
- **Database Indexes**: Created for fast queries

## Error Handling

The application includes comprehensive error handling for:
- Invalid file types and sizes
- Database errors
- FFmpeg processing failures
- Network errors
- Upload interruptions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please create an issue on GitHub.

---

**Built with ❤️ using Next.js, Express.js, and Supabase**
