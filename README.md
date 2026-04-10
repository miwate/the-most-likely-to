# The Most Likely To

A web platform where anyone can create their own "Who's most likely to..." quiz, share it via a unique link, and view results in real time.


## Quick Setup

### 1. Supabase

1. Create a project on [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste the full contents of `supabase/schema.sql`
3. Note your **Project URL** and **anon key** (Settings -> API)

### 2. Local project

```bash
# Clone / download the project
cd qui-est-le-plus

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# -> Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start the dev server
npm run dev
```

The site runs at `http://localhost:3000`.

### 3. Deployment

```bash
npm run build
```

The `dist/` folder can be deployed to Vercel, Netlify, Cloudflare Pages, or any static hosting provider.

**Important**: Configure SPA redirects (all routes -> `index.html`).

On Vercel, add a `vercel.json`:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

## Architecture

```
src/
├── main.jsx              Entrypoint
├── App.jsx               Routes
├── supabase.js           Supabase client
├── styles/global.css     Full design system
├── pages/
│   ├── Landing.jsx       Home page
│   ├── Create.jsx        Creation form (photos + questions)
│   ├── Quiz.jsx          Player quiz (animations, 3D tilt, etc.)
│   ├── Done.jsx          End screen (confetti)
│   └── Admin.jsx         Real-time results dashboard
├── components/
│   ├── Particles.jsx     Canvas particle background
│   ├── Blobs.jsx         Decorative blobs
│   └── Confetti.jsx      Canvas confetti burst
└── hooks/
    └── usePlayer.js      Anonymous player ID (cookie)
```

## Flow

1. **Creator** -> `/create` -> uploads photos, adds questions, publishes
2. Receives 2 links: **quiz** (`/quiz/abc123`) + **admin** (`/quiz/abc123/admin?key=xxx`)
3. **Players** -> quiz link -> answer questions -> cookie prevents double voting
4. **Creator** -> admin link -> real-time results (bars, stats)

## Database

| Table       | Role                                      |
|-------------|-------------------------------------------|
| `quizzes`   | Quiz + admin key                          |
| `questions` | Questions linked to a quiz                |
| `choices`   | Choices (label + photo) per question      |
| `votes`     | One vote = player × question × choice     |
