# BlogForge — Multi-Blog CMS Dashboard

A free, open-source blog CMS admin panel built with Next.js + Supabase.
Users can create multiple blogs, write posts with a rich editor, and publish publicly.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database + Auth**: Supabase
- **Editor**: TipTap
- **Styling**: Tailwind CSS
- **Table**: TanStack Table
- **Icons**: Lucide React

---

## 🚀 Setup in 5 Steps

### Step 1 — Clone & Install

```bash
git clone https://github.com/yourusername/blogforge
cd blogforge
npm install
```

### Step 2 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **anon public key** from Settings → API

### Step 3 — Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4 — Run the Database Schema

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase-schema.sql`
3. Paste and run it

This creates:
- `blogs` table (multi-blog support)
- `posts` table (with SEO fields, views counter)
- `tags` and `post_tags` tables
- Row Level Security policies (users only see their own data)
- Auto `updated_at` trigger
- `increment_post_views` function

### Step 5 — Enable Supabase Auth

1. Go to Supabase Dashboard → Authentication → Providers
2. Make sure **Email** provider is enabled
3. (Optional) Disable email confirmation for dev: Auth → Settings → uncheck "Enable email confirmations"

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
blogforge/
├── src/app/
│   ├── (auth)/
│   │   ├── login/           # Login page
│   │   └── register/        # Register page
│   ├── dashboard/           # Protected admin area
│   │   ├── page.tsx         # Overview with stats
│   │   ├── blogs/
│   │   │   ├── new/         # Create blog
│   │   │   └── [blogId]/
│   │   │       ├── page.tsx          # Blog overview
│   │   │       ├── posts/
│   │   │       │   ├── page.tsx      # Posts list with filters
│   │   │       │   ├── new/          # TipTap editor (new)
│   │   │       │   └── [postId]/     # TipTap editor (edit)
│   │   │       └── settings/         # Blog settings
│   │   └── settings/        # Account settings
│   └── b/                   # Public blog reader
│       └── [username]/[blogSlug]/[postSlug]/
├── components/
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx  # Sidebar + layout
│   │   └── PostsTable.tsx       # Filterable posts table
│   └── editor/
│       └── TipTapEditor.tsx     # Rich text editor
├── lib/
│   └── supabase/
│       ├── client.ts        # Browser Supabase client
│       └── server.ts        # Server Supabase client
├── types/index.ts            # TypeScript types
├── middleware.ts             # Route protection
└── supabase-schema.sql       # Full DB schema
```

---

## 🌐 Public Blog URLs

When a user publishes a post, it's accessible at:
```
yourdomain.com/b/{username}/{blog-slug}/{post-slug}
```

Example: `blogforge.com/b/johndoe/tech-insights/react-server-components`

---

## 🔧 Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add your environment variables in the Vercel dashboard under Project Settings → Environment Variables.

---

## 🗺️ Roadmap

- [x] Auth (login/register)
- [x] Multi-blog support
- [x] TipTap rich editor
- [x] Draft / Published / Archived status
- [x] SEO fields per post
- [x] View counter
- [x] Public reader page
- [ ] Custom domains
- [ ] Image uploads (Supabase Storage)
- [ ] Analytics dashboard
- [ ] Tags & categories
- [ ] RSS feed
- [ ] Developer API docs (bring your own Supabase)
