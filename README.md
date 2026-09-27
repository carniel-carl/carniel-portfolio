# Carniel Portfolio

Personal portfolio and blog for **Nmugha Chimezie Carniel**. It is built with Next.js 16 (App Router) and has its own admin panel, so projects, skills, blog posts, the bio, the resume and social links can all be edited without changing code.

## Features

### Public site
- **Home page**: animated hero, kinetic name, velocity marquee, selected work, capabilities and latest writing. Built with Framer Motion and Lenis smooth scrolling.
- **Portfolio** (`/portfolio`): the full project grid with stack badges, live/code links, highlights and process.
- **Blog** (`/blog`, `/blog/[slug]`): category filters, search, table of contents, reading progress, share bar, author cards, syntax-highlighted code blocks, related posts and view-transition animations between the list and a post.
- **Resume download** (`/resume`): serves the current uploaded resume with a clean filename.
- **Extras**: light/dark theme, generative ambient soundscapes (Web Audio API) with optional Spotify playlists, and a privacy page.
- **SEO**: canonical URLs, Open Graph metadata, JSON-LD structured data and an `ads.txt` route generated from the AdSense ID.

### Admin panel (`/admin`)
- Sign in with email and password (Auth.js v5 credentials, bcrypt-hashed passwords). `src/proxy.ts` protects every `/admin` route.
- Create, edit and delete **projects, blog posts, categories, skills, social links, the About section and admin users**.
- A rich-text blog editor built on Tiptap, with image uploads, previews and a publish/unpublish toggle.
- Image, video and PDF uploads through UploadThing.
- An **analytics dashboard** that pulls from Mixpanel.
- A command menu (⌘K) and keyboard shortcuts in forms.

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Cache Components, Server Actions), React 19, TypeScript |
| Styling | Tailwind CSS 3, Sass, shadcn/ui, Radix UI |
| Animation | Framer Motion, Lenis |
| Database | MongoDB via [Prisma](https://www.prisma.io) 6 |
| Auth | [Auth.js (NextAuth v5)](https://authjs.dev) with a Prisma adapter |
| Content | Tiptap editor, lowlight, sanitize-html / DOMPurify |
| Forms | React Hook Form, Zod, Formspree (contact form) |
| Uploads | [UploadThing](https://uploadthing.com) |
| Analytics & ads | Mixpanel, Recharts, Google AdSense (optional) |
| Tooling | [Bun](https://bun.sh), ESLint |

## Getting started

### Prerequisites
- [Bun](https://bun.sh) 1.x. It is the package manager, and the seed script runs with it.
- A MongoDB database, such as a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster. Prisma's MongoDB connector needs a replica set, which Atlas provides.
- An [UploadThing](https://uploadthing.com) app for admin uploads.

### 1. Clone and install

```bash
git clone git@github.com:carniel-carl/carniel-portfolio.git
cd carniel-portfolio
bun install          # also runs `prisma generate` via postinstall
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```bash
# Database
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority"

# Auth.js v5 (generate a secret with: bunx auth secret)
AUTH_SECRET=""
AUTH_URL="http://localhost:3000"

# First admin account, created by the seed script
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="change-me"

# UploadThing
UPLOADTHING_TOKEN=""

# Contact form (Formspree form ID)
NEXT_PUBLIC_FORM_ID=""

# Site URL for canonical links and Open Graph (optional locally)
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Optional: Mixpanel analytics
NEXT_PUBLIC_MIXPANEL_TOKEN=""
MIXPANEL_PROJECT_ID=""
MIXPANEL_SERVICE_ACCOUNT_USERNAME=""
MIXPANEL_SERVICE_ACCOUNT_SECRET=""

# Optional: Spotify playlists in the sound player
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=""

# Optional: Google AdSense
NEXT_PUBLIC_ADSENSE_CLIENT=""            # e.g. ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_BLOG_SIDEBAR_SLOT=""
```

| Variable | Required | Purpose |
| --- | :---: | --- |
| `DATABASE_URL` | ✅ | MongoDB connection string |
| `AUTH_SECRET` | ✅ | Signs Auth.js sessions |
| `AUTH_URL` | ✅ | Base URL of the app for Auth.js |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | ✅ | Login for the first admin, created by the seed (defaults to `admin@example.com` / `admin123`) |
| `UPLOADTHING_TOKEN` | ✅ | Image, video and PDF uploads in the admin panel |
| `NEXT_PUBLIC_FORM_ID` | ✅ | Formspree form behind the contact section |
| `NEXT_PUBLIC_SITE_URL` | Production | Absolute site URL. Falls back to Vercel's production domain, then `localhost` |
| `NEXT_PUBLIC_MIXPANEL_TOKEN` | Optional | Client-side page tracking |
| `MIXPANEL_PROJECT_ID`, `MIXPANEL_SERVICE_ACCOUNT_*` | Optional | Server-side queries for the admin analytics dashboard |
| `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` | Optional | Turns on Spotify sign-in (PKCE, no client secret) |
| `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_BLOG_SIDEBAR_SLOT` | Optional | Blog sidebar ads and `/ads.txt` |

> Never commit `.env`. It is listed in `.gitignore`.

### 3. Set up the database

```bash
bunx prisma db push   # create collections and indexes from prisma/schema.prisma
bunx prisma db seed   # create the admin user and starter content
```

The seed is safe to re-run. It upserts the admin user and adds About, projects, skills and social links only when those collections are empty.

### 4. Run the dev server

```bash
bun dev
```

- Site: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login). Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Usage

### Managing content
Everything on the public site comes from the database. Change it in the admin panel:

| Admin page | What it controls |
| --- | --- |
| `/admin/projects` | Portfolio projects: media, stack, links, featured flag, visibility and order |
| `/admin/blog` | Blog posts: write in Tiptap, preview, then publish |
| `/admin/blog/categories` | Blog categories and their colors |
| `/admin/skills` | Skills shown on the site (icon name + icon library) |
| `/admin/about` | Bio, profile picture and resume PDF |
| `/admin/social` | Social links (GitHub, LinkedIn, …) |
| `/admin/users` | Admin accounts |
| `/admin/analytics` | Mixpanel traffic dashboard |

Public pages are cached with `"use cache"` and cache tags (`src/lib/cache-tags.ts`). Admin server actions invalidate those tags, so edits appear without a rebuild.

### Spotify in the sound player (optional)
1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Add `http://127.0.0.1:3000/spotify/callback` as a Redirect URI. Spotify rejects `localhost`, so open the dev site at `127.0.0.1`. For production, also add `https://<your-domain>/spotify/callback`.
3. Set `NEXT_PUBLIC_SPOTIFY_CLIENT_ID`.

### Available scripts

| Command | Description |
| --- | --- |
| `bun dev` | Start the development server |
| `bun run build` | Create a production build |
| `bun start` | Serve the production build |
| `bunx prisma db push` | Sync the Prisma schema to MongoDB |
| `bunx prisma db seed` | Seed the admin user and starter content |
| `bunx prisma studio` | Browse the database in a GUI |

## Project structure

```
carniel-portfolio/
├── prisma/
│   ├── schema.prisma          # MongoDB models: User, About, Project, Skill, SocialLink, BlogPost, Category
│   └── seed.ts                # Admin user + starter content
├── public/                    # Static images, favicon, fallback resume PDF
└── src/
    ├── app/
    │   ├── (public)/          # Home, /portfolio, /blog, /blog/[slug], /privacy
    │   ├── (Admin)/admin/     # Login + dashboard, projects, blog, skills, about, social, users, analytics
    │   ├── api/               # Auth.js, blog search, UploadThing routes
    │   ├── resume/route.ts    # Resume download with a clean filename
    │   ├── ads.txt/route.ts   # AdSense ads.txt
    │   └── spotify/callback/  # Spotify PKCE redirect
    ├── components/
    │   ├── admin/             # Admin shell, forms, Tiptap editor, tables
    │   ├── blog/              # Blog cards, TOC, share bar, reading progress, code blocks
    │   ├── layout/, motion/, general/   # Navbar, footer, preloader, animation helpers, theme, sound player
    │   ├── ui/                # shadcn/ui primitives
    │   └── tiptap-*/          # Tiptap nodes, icons and UI primitives
    ├── sections/              # Page sections (home, portfolio, projects, about, skills, contact)
    ├── lib/
    │   ├── actions/           # Server actions (CRUD for each content type)
    │   ├── schemas/           # Zod validation schemas
    │   ├── data/              # Cached data fetching for public pages
    │   ├── auth.ts, prisma.ts, site.ts, cache-tags.ts, spotify.ts, ambient.ts, mixpanel*.ts
    │   └── ...
    ├── hooks/                 # Reusable React hooks
    ├── styles/                # Sass variables and keyframes
    └── proxy.ts               # Protects /admin routes (Next.js 16 proxy, formerly middleware)
```

## Deployment

The site is set up for [Vercel](https://vercel.com):

1. Import the repository into Vercel.
2. Add the environment variables above. Set `AUTH_URL` and `NEXT_PUBLIC_SITE_URL` to your production domain.
3. Allow Vercel's IP addresses in MongoDB Atlas (or allow `0.0.0.0/0`).
4. Deploy. `postinstall` runs `prisma generate` during the build.
5. Run `bunx prisma db seed` once against the production database to create the admin account.

## Author

**Nmugha Chimezie Carniel** · [GitHub @carniel-carl](https://github.com/carniel-carl)
