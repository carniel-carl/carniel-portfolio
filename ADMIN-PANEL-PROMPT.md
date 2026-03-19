# Claude AI Agent Prompt: Build Admin Panel for Portfolio

> Copy this entire prompt and paste it into a new Claude AI agent conversation (Claude Code, Cursor, or similar). The agent will build the complete admin panel for your portfolio.

---

## PROMPT START

You are building a full admin panel with authentication for an existing Next.js 14 portfolio website. Follow these instructions precisely, step by step.

---

## 1. PROJECT CONTEXT

This is a Next.js 14.2.8 portfolio site (App Router, React 18, TypeScript 5) with:
- **Tailwind CSS 3.4.1** + Shadcn UI components
- **Framer Motion** for animations
- **next-themes** for dark/light mode
- **Formspree** for contact form
- **All content is hardcoded** in TypeScript files under `src/data/`

### Current File Structure
```
src/
├── app/
│   ├── page.tsx              # Home/landing page
│   ├── layout.tsx            # Root layout (Navbar + Footer wrap all pages)
│   ├── globals.css           # Global styles + CSS variables
│   ├── portfolio/page.tsx    # Portfolio page (About + Projects + Skills + Contact)
│   └── blog/page.tsx         # Blog page ("Coming Soon" placeholder)
├── sections/
│   ├── About.tsx             # Hardcoded bio text, profile image, resume download
│   ├── Projects.tsx          # Renders projects from static data with tabs (Featured/Other)
│   ├── Skills.tsx            # Renders skills grid from static data
│   └── Contact.tsx           # Formspree contact form
├── components/
│   ├── general/
│   │   ├── ProjectCard.tsx   # Compound component (Tag, Title, Description, Stack, Image, ActionButton)
│   │   └── MaxWidth.tsx      # Max-width container wrapper
│   ├── layout/
│   │   ├── navbar/
│   │   │   ├── Navbar.tsx    # Top navigation
│   │   │   └── FloatNav.tsx  # Floating nav on portfolio page
│   │   ├── Footer.tsx
│   │   ├── ScrollToTop.tsx
│   │   └── ComingSoon.tsx
│   ├── ui/                   # Shadcn UI (Button, Input, Sonner)
│   └── animations/           # Framer motion variants
├── data/
│   ├── project-data.ts       # 6 featured + 1 other project
│   ├── skills-data.ts        # 21 skills with react-icons component references
│   ├── navlinks.ts           # Navigation links
│   └── social-links.ts       # Social media URLs
├── context/
│   ├── theme-provider.tsx    # next-themes wrapper
│   └── project-card-context.tsx
├── types/project.d.ts        # ProjectDataType, ProjectCardTypes
├── lib/utils.ts              # cn() utility (clsx + tailwind-merge)
└── assests/images/            # Profile picture (profile-pic.jpg)
```

### Current Data Shapes

**Project data** (`src/data/project-data.ts`):
```ts
type ProjectDataType = {
  tag?: string;        // e.g. "Blog", "ECommerce", "Landing", "Web3"
  name: string;        // e.g. "Creator Economy IQ"
  img: string;         // e.g. "/images/projects/jollofdiary.png"
  live?: string;       // live URL
  code?: string;       // GitHub URL
  description: string; // project description
  stack?: string[];    // e.g. ["Nextjs", "TailwindCss", "Typescript"]
};
```

**Skills data** (`src/data/skills-data.ts`):
```ts
// Each skill has a title and an imported react-icons component
// Example entries:
{ title: "React", icon: FaReact }           // from "react-icons/fa"
{ title: "NextJs", icon: SiNextdotjs }      // from "react-icons/si"
{ title: "MongoDB", icon: BiLogoMongodb }   // from "react-icons/bi"
// 21 skills total
```

**Social links** (`src/data/social-links.ts`):
```ts
{ name: "linkedin", link: "https://www.linkedin.com/in/carniel1/" }
{ name: "github", link: "https://github.com/carniel-carl" }
{ name: "twitter", link: "https://twitter.com/dripcarniel" }
{ name: "instagram", link: "instagram://user?username=carniel_carl" }
```

**About section** (`src/sections/About.tsx`):
- Bio text is hardcoded inline (paragraph about discovering passion for coding)
- Profile image imported from `src/assests/images/profile-pic.jpg`
- Resume download links to `chimezie-resume.pdf` in public folder

### Current Root Layout (`src/app/layout.tsx`):
The root layout wraps ALL pages with Navbar and Footer. This must be refactored so the admin panel has its own layout without the portfolio chrome.

```tsx
// Current structure that needs refactoring:
<html>
  <body>
    <ThemeWrapper>
      <div className="grid grid-rows-[3.5rem_1fr]">
        <Navbar />
        <main>{children}</main>
      </div>
      <Footer />
      <Toaster />
    </ThemeWrapper>
  </body>
</html>
```

---

## 2. WHAT TO BUILD

Build a complete admin panel at `/admin` that allows CRUD management of all portfolio content, plus a full blog system. The admin panel should use the existing Shadcn UI component library and Tailwind styling for consistency.

### Tech Stack for Admin:
- **AuthJS v5** (next-auth@5) — Credentials provider, single admin user
- **MongoDB** — database (user will provide connection string)
- **Prisma** — ORM for MongoDB
- **Tiptap** — rich text editor (for About bio and Blog posts)
- **UploadThing** — image/video/document uploads
- **Shadcn UI** — admin interface components (already partially installed)

### Sections to Manage:
1. **About** — bio (rich text), profile picture (image upload), resume (file upload)
2. **Projects** — full CRUD: name, description, tag, image/video upload, live URL, code URL, tech stack, featured toggle, display order
3. **Skills** — full CRUD: title, icon (picker from react-icons), display order
4. **Blog** — full CRUD: title, slug (auto-generated), content (Tiptap rich text), excerpt, cover image, published/draft toggle, publish date
5. **Social Links** — edit social media URLs

---

## 3. STEP-BY-STEP IMPLEMENTATION

### STEP 1: Install Dependencies

```bash
# Auth
npm install next-auth@5 @auth/prisma-adapter bcryptjs
npm install -D @types/bcryptjs

# Database
npm install prisma @prisma/client
npx prisma init

# Rich Text Editor - Tiptap
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-heading @tiptap/extension-code-block-lowlight @tiptap/extension-underline @tiptap/extension-text-align @tiptap/extension-color @tiptap/extension-text-style
npm install lowlight

# File Uploads
npm install uploadthing @uploadthing/react

# HTML Sanitization
npm install dompurify
npm install -D @types/dompurify

# Additional Shadcn UI components for admin
npx shadcn@latest add table dialog dropdown-menu tabs label textarea select badge separator sheet switch card
```

### STEP 2: Environment Variables

Add to `.env` (DO NOT commit this file):
```env
# Existing
NEXT_PUBLIC_FORM_ID="xyyqjarb"

# MongoDB
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority"

# AuthJS v5
AUTH_SECRET="generate-a-random-32-char-string-here"
AUTH_URL="http://localhost:3000"

# Admin credentials (used by seed script only)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-secure-password"

# UploadThing
UPLOADTHING_TOKEN="your-uploadthing-token"
```

Generate AUTH_SECRET with: `npx auth secret`

### STEP 3: Prisma Schema

Create `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model About {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  bio           String   // HTML content from Tiptap
  profilePicUrl String
  resumeUrl     String
  updatedAt     DateTime @updatedAt
}

model Project {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  tag         String?
  description String
  img         String   // URL from UploadThing
  mediaType   String   @default("image") // "image" or "video"
  live        String?
  code        String?
  stack       String[]
  featured    Boolean  @default(false)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Skill {
  id       String @id @default(auto()) @map("_id") @db.ObjectId
  title    String
  iconName String // e.g. "FaReact"
  iconLib  String // e.g. "fa" (maps to react-icons/fa)
  order    Int    @default(0)
}

model SocialLink {
  id   String @id @default(auto()) @map("_id") @db.ObjectId
  name String @unique
  link String
}

model BlogPost {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  title       String
  slug        String    @unique
  content     String    // HTML from Tiptap
  excerpt     String?
  coverImage  String?
  published   Boolean   @default(false)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

Run: `npx prisma db push`

### STEP 4: Prisma Client Singleton

Create `src/lib/prisma.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
```

### STEP 5: AuthJS v5 Configuration

Create `src/lib/auth.ts`:

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
```

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

### STEP 6: Middleware

Create `src/middleware.ts` at the project root (inside `src/`):

```ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = req.nextUrl.pathname === "/admin/login";
  const isAuthApi = req.nextUrl.pathname.startsWith("/api/auth");

  // Don't protect auth API routes or the login page
  if (isAuthApi || isLoginPage) {
    // If logged in and trying to access login page, redirect to admin
    if (isLoginPage && isLoggedIn) {
      return NextResponse.redirect(new URL("/admin", req.nextUrl));
    }
    return NextResponse.next();
  }

  // Protect all /admin routes
  if (isAdminRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
  }

  // Protect all /api/admin routes
  if (req.nextUrl.pathname.startsWith("/api/admin") && !isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
```

### STEP 7: Seed Script

Create `prisma/seed.ts`:

```ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed admin user
  const hashedPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "admin123",
    12
  );

  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@example.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@example.com",
      name: "Admin",
      password: hashedPassword,
    },
  });

  // Seed About
  await prisma.about.deleteMany();
  await prisma.about.create({
    data: {
      bio: "<p>I discovered my passion for coding while building a website for my art business. Since then, I have immersed myself in the world of technology, continuously expanding my skills and exploring its vast potential. Combining creativity with functionality, makes my journey in tech both fulfilling and dynamic.</p>",
      profilePicUrl: "/images/profile-pic.jpg",
      resumeUrl: "/chimezie-resume.pdf",
    },
  });

  // Seed Featured Projects
  const featuredProjects = [
    {
      tag: "Blog",
      name: "Creator Economy IQ",
      img: "/images/projects/jollofdiary.png",
      live: "https://www.creatoreconomyiq.com/",
      description: "Creator Economy IQ is a premier data and business insights resource platform, illuminating the business and commercial aspects of the African creator economy.",
      stack: ["Nextjs", "TailwindCss", "Typescript", "Prisma", "MongoDb", "NextAuth", "Disqus"],
      featured: true,
      order: 0,
    },
    {
      tag: "ECommerce",
      name: "Othrika",
      img: "/images/projects/othrika.png",
      live: "https://othrika.com/",
      description: "Make money selling old clothes/thrifts online with Othrika Ecommerce platform, managed by a custom built inventory admin dashboard.",
      stack: ["Nextjs", "Typescript", "NextAuth", "Google Auth", "TailwindCss", "ShadCn", "MongoDb", "Prisma", "Paystack"],
      featured: true,
      order: 1,
    },
    {
      tag: "Landing",
      name: "TechnoClean Dry Cleaners",
      img: "/images/projects/technoclean.png",
      live: "https://technocleanltd.com/",
      description: "A professional dry cleaning and laundry service website that offers convenient online booking, eco-friendly cleaning methods, and doorstep pickup and delivery for a seamless customer experience.",
      stack: ["Nextjs", "TailwindCss", "Typescript", "ShadCn", "NextAuth", "motion/react"],
      featured: true,
      order: 2,
    },
    {
      tag: "ECommerce",
      name: "Greens review",
      img: "/images/projects/greens.png",
      live: "https://greensreviews.vercel.app/",
      code: "https://github.com/carniel-carl/greenspace",
      description: "An Ecommerce platform to sell phone cables, managed by a custom built inventory admin dashboard.",
      stack: ["Nextjs", "TailwindCss", "Typescript", "ShadCn", "NextAuth", "MongoDb", "Prisma"],
      featured: true,
      order: 3,
    },
    {
      tag: "Landing",
      name: "Zubion Logistics",
      img: "/images/projects/zubion.png",
      live: "https://www.zubionlogistics.com/",
      code: "https://github.com/carniel-carl/zubion",
      description: "Looking for a way to save time and money on your Amazon business? Zubion Logistics FBA fulfillment services take care of everything from picking and packing to shipping to your customers",
      stack: ["Nextjs", "TailwindCss", "Typescript", "ShadCn", "Google Form"],
      featured: true,
      order: 4,
    },
    {
      tag: "Web3",
      name: "Pouch Swap",
      img: "/images/projects/pouchswap.png",
      live: "https://www.pouchswap.com/",
      code: "https://github.com/Bravark/pouch-swap-web",
      description: "The fastest, safest and cheapest token swapping and bridging protocol.",
      stack: ["Nextjs", "TailwindCss", "Typescript", "ShadCn"],
      featured: true,
      order: 5,
    },
  ];

  const otherProjects = [
    {
      name: "Todo App",
      img: "/images/projects/todo.png",
      live: "https://todo-carniel-app.vercel.app/",
      code: "https://github.com/carniel-carl/todo",
      description: "A Demo project built with react for task management with persistent data storage.",
      featured: false,
      order: 0,
      stack: [],
    },
  ];

  await prisma.project.deleteMany();
  for (const project of [...featuredProjects, ...otherProjects]) {
    await prisma.project.create({ data: project });
  }

  // Seed Skills
  const skills = [
    { title: "React", iconName: "FaReact", iconLib: "fa", order: 0 },
    { title: "React Router", iconName: "SiReactrouter", iconLib: "si", order: 1 },
    { title: "NextJs", iconName: "SiNextdotjs", iconLib: "si", order: 2 },
    { title: "JavaScript", iconName: "BiLogoJavascript", iconLib: "bi", order: 3 },
    { title: "TypeScript", iconName: "SiTypescript", iconLib: "si", order: 4 },
    { title: "Jest", iconName: "SiJest", iconLib: "si", order: 5 },
    { title: "Redux", iconName: "SiRedux", iconLib: "si", order: 6 },
    { title: "HTML", iconName: "BiLogoHtml5", iconLib: "bi", order: 7 },
    { title: "CSS", iconName: "BiLogoCss3", iconLib: "bi", order: 8 },
    { title: "SASS", iconName: "SiSass", iconLib: "si", order: 9 },
    { title: "TailwindCSS", iconName: "SiTailwindcss", iconLib: "si", order: 10 },
    { title: "Python", iconName: "FaPython", iconLib: "fa", order: 11 },
    { title: "Django", iconName: "BiLogoDjango", iconLib: "bi", order: 12 },
    { title: "Node", iconName: "BiLogoNodejs", iconLib: "bi", order: 13 },
    { title: "Firebase", iconName: "BiLogoFirebase", iconLib: "bi", order: 14 },
    { title: "Webpack", iconName: "SiWebpack", iconLib: "si", order: 15 },
    { title: "SQL", iconName: "PiFileSql", iconLib: "pi", order: 16 },
    { title: "SQLite", iconName: "SiSqlite", iconLib: "si", order: 17 },
    { title: "PostgresSQL", iconName: "BiLogoPostgresql", iconLib: "bi", order: 18 },
    { title: "MongoDB", iconName: "BiLogoMongodb", iconLib: "bi", order: 19 },
    { title: "Git", iconName: "BsGit", iconLib: "bs", order: 20 },
    { title: "GitHub", iconName: "BsGithub", iconLib: "bs", order: 21 },
  ];

  await prisma.skill.deleteMany();
  for (const skill of skills) {
    await prisma.skill.create({ data: skill });
  }

  // Seed Social Links
  const socialLinks = [
    { name: "linkedin", link: "https://www.linkedin.com/in/carniel1/" },
    { name: "github", link: "https://github.com/carniel-carl" },
    { name: "twitter", link: "https://twitter.com/dripcarniel" },
    { name: "instagram", link: "instagram://user?username=carniel_carl" },
  ];

  await prisma.socialLink.deleteMany();
  for (const social of socialLinks) {
    await prisma.socialLink.create({ data: social });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

Install tsx: `npm install -D tsx`

Run seed: `npx prisma db seed`

### STEP 8: Layout Refactoring

This is the most critical structural change. The current root layout wraps everything with Navbar and Footer. The admin panel must NOT have these.

**8a. Create route group `(public)` for existing pages:**

Move existing pages into a route group:
- Move `src/app/page.tsx` → `src/app/(public)/page.tsx`
- Move `src/app/portfolio/` → `src/app/(public)/portfolio/`
- Move `src/app/blog/` → `src/app/(public)/blog/`

**8b. Create `src/app/(public)/layout.tsx`:**

```tsx
import Navbar from "@/components/layout/navbar/Navbar";
import Footer from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="grid grid-rows-[3.5rem_1fr]">
        <div>
          <Navbar />
        </div>
        <main className="row-start-2 row-end-3">{children}</main>
      </div>
      <Footer />
    </>
  );
}
```

**8c. Simplify root `src/app/layout.tsx`:**

```tsx
import "./globals.css";
import type { Metadata } from "next";
import { Montserrat, Nunito_Sans, Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import ThemeWrapper from "@/context/theme-provider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--poppins",
});
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--montserrat",
});
const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--nunito",
});

export const metadata: Metadata = {
  title: "Chimezie's portfolio",
  description: "Hello, Welcome to my portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.className} ${montserrat.variable} ${nunito.variable} antialiased overscroll-none relative min-h-screen`}
      >
        <ThemeWrapper>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeWrapper>
      </body>
    </html>
  );
}
```

**8d. Create admin layout `src/app/admin/layout.tsx`:**

Build a sidebar layout for the admin panel with navigation links to:
- Dashboard (`/admin`)
- Projects (`/admin/projects`)
- Skills (`/admin/skills`)
- About (`/admin/about`)
- Blog (`/admin/blog`)
- Social Links (`/admin/social`)
- Sign out button

The admin layout should:
- Use Shadcn UI components for sidebar navigation
- Be responsive (collapsible sidebar on mobile)
- Show the current user's email
- Include a sign out button that calls the AuthJS signOut function
- NOT include the portfolio Navbar or Footer
- Use the same Tailwind theme (dark mode should work in admin too)

**8e. Create login page `src/app/admin/login/page.tsx`:**

Build a clean login form with:
- Email and password inputs (Shadcn Input component)
- Submit button (Shadcn Button)
- Error message display for invalid credentials
- Uses AuthJS `signIn("credentials", ...)` on submit
- Redirects to `/admin` on success
- Centered card layout, works in both light/dark mode

**IMPORTANT: After this step, verify the public site still works identically. All existing routes, animations, and styling must be preserved.**

### STEP 9: UploadThing Setup

**9a. Create file router `src/app/api/uploadthing/core.ts`:**

```ts
import { auth } from "@/lib/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new UploadThingError("Unauthorized");
      return { userId: session.user?.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl };
    }),

  videoUploader: f({
    video: { maxFileSize: "64MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new UploadThingError("Unauthorized");
      return { userId: session.user?.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl };
    }),

  documentUploader: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new UploadThingError("Unauthorized");
      return { userId: session.user?.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

**9b. Create route handler `src/app/api/uploadthing/route.ts`:**

```ts
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
```

### STEP 10: Icon Map Utility

Create `src/lib/icon-map.ts` to resolve icon name strings (stored in DB) to actual react-icons components:

```ts
import { FaReact, FaPython } from "react-icons/fa";
import { BsGit, BsGithub } from "react-icons/bs";
import {
  BiLogoJavascript, BiLogoHtml5, BiLogoCss3, BiLogoDjango,
  BiLogoNodejs, BiLogoFirebase, BiLogoPostgresql, BiLogoMongodb,
} from "react-icons/bi";
import { PiFileSql } from "react-icons/pi";
import {
  SiRedux, SiTypescript, SiJest, SiSass, SiTailwindcss,
  SiWebpack, SiSqlite, SiReactrouter, SiNextdotjs,
} from "react-icons/si";
import { IconType } from "react-icons";

export const iconMap: Record<string, IconType> = {
  FaReact, FaPython,
  BsGit, BsGithub,
  BiLogoJavascript, BiLogoHtml5, BiLogoCss3, BiLogoDjango,
  BiLogoNodejs, BiLogoFirebase, BiLogoPostgresql, BiLogoMongodb,
  PiFileSql,
  SiRedux, SiTypescript, SiJest, SiSass, SiTailwindcss,
  SiWebpack, SiSqlite, SiReactrouter, SiNextdotjs,
};

export function getIcon(iconName: string): IconType | null {
  return iconMap[iconName] || null;
}
```

When adding new skills through admin, the icon picker should let the user search/select from available icons. You can expand this map as needed — or create a more comprehensive dynamic import system.

### STEP 11: Tiptap Editor Component

Create `src/components/admin/TiptapEditor.tsx`:

Build a reusable Tiptap rich text editor component with:
- **Extensions**: StarterKit (bold, italic, lists, headings, code blocks, blockquotes), Image, Link, Placeholder, Underline, TextAlign, Color, TextStyle, CodeBlockLowlight (with syntax highlighting via lowlight)
- **Toolbar**: Formatting buttons for bold, italic, underline, strikethrough, headings (H1-H3), bullet list, ordered list, blockquote, code block, link, image upload (via UploadThing), text alignment, undo/redo
- **Image upload**: When the user clicks the image button in the toolbar, trigger an UploadThing upload dialog. On successful upload, insert the image URL into the editor.
- **Props**: `content: string` (initial HTML), `onChange: (html: string) => void`, `placeholder?: string`
- **Styling**: Style the editor to look clean with Tailwind. Add a border, min-height, and proper padding. The toolbar should use icon buttons (from lucide-react).

This component will be used for:
- About bio editing
- Blog post content editing

### STEP 12: API Routes

Create CRUD API routes. Every route must check authentication using `auth()` from `@/lib/auth`. Return 401 if not authenticated.

**12a. Projects API:**

`src/app/api/admin/projects/route.ts`:
- `GET` — return all projects ordered by `order` field
- `POST` — create new project (validate required fields: name, description, img)

`src/app/api/admin/projects/[id]/route.ts`:
- `GET` — return single project by ID
- `PUT` — update project
- `DELETE` — delete project

**12b. Skills API:**

`src/app/api/admin/skills/route.ts`:
- `GET` — return all skills ordered by `order` field
- `POST` — create new skill (validate: title, iconName, iconLib)

`src/app/api/admin/skills/[id]/route.ts`:
- `PUT` — update skill
- `DELETE` — delete skill

**12c. About API:**

`src/app/api/admin/about/route.ts`:
- `GET` — return the single About record (create default if none exists)
- `PUT` — update the About record

**12d. Blog API:**

`src/app/api/admin/blog/route.ts`:
- `GET` — return all blog posts (admin sees all, including drafts), ordered by createdAt desc
- `POST` — create new blog post. Auto-generate slug from title (lowercase, replace spaces with hyphens, remove special chars). Sanitize HTML content with DOMPurify before storing.

`src/app/api/admin/blog/[id]/route.ts`:
- `GET` — return single post by ID
- `PUT` — update post. Re-sanitize content. If `published` is set to true and `publishedAt` is null, set `publishedAt` to now.
- `DELETE` — delete post

**12e. Social Links API:**

`src/app/api/admin/social/route.ts`:
- `GET` — return all social links
- `PUT` — update all social links (accepts array, upserts by name)

### STEP 13: Admin UI Pages

Build all admin pages using Shadcn UI components. Every page should have:
- A heading and breadcrumb
- Loading states (skeleton loaders or spinners)
- Toast notifications on success/error (using Sonner, already installed)
- Responsive design

**13a. Dashboard `/admin/page.tsx`:**
- Welcome message with admin name
- Content overview cards showing counts: X projects, X skills, X blog posts (published/drafts)
- Quick links to each section

**13b. Projects `/admin/projects/page.tsx`:**
- Table (Shadcn DataTable) listing all projects with columns: Image thumbnail, Name, Tag, Featured (badge), Order, Actions (edit/delete)
- "Add New Project" button → navigates to `/admin/projects/new`
- Delete confirmation dialog (Shadcn AlertDialog)
- Drag-to-reorder or order number input for display order

**13c. Project Form `/admin/projects/new/page.tsx` and `/admin/projects/[id]/edit/page.tsx`:**
- Reusable form component for both create and edit
- Fields: Name (Input), Tag (Input or Select with common tags), Description (Textarea), Image/Video upload (UploadThing component with preview), Live URL (Input), Code URL (Input), Tech Stack (dynamic list — add/remove items), Featured toggle (Switch), Order (number Input)
- Image preview after upload
- Form validation (name, description, and image are required)
- Submit creates/updates via API, shows toast, redirects to projects list

**13d. Skills `/admin/skills/page.tsx`:**
- Grid or table of skills with icon preview, title, and order
- Add/Edit via dialog (Shadcn Dialog) — no separate page needed
- Icon picker: a searchable grid of available react-icons. Show icon name + preview. When selected, store `iconName` and `iconLib`.
- Delete with confirmation
- Reorder capability

**13e. About `/admin/about/page.tsx`:**
- Profile picture: current image preview + UploadThing upload button to replace
- Resume: current file name/link + UploadThing upload button to replace
- Bio: Tiptap editor (the one built in Step 11) pre-filled with current bio HTML
- Save button that PUTs to the About API

**13f. Blog `/admin/blog/page.tsx`:**
- Table listing all posts: Title, Status (Published/Draft badge), Created date, Actions
- "New Post" button → `/admin/blog/new`

**13g. Blog Post Form `/admin/blog/new/page.tsx` and `/admin/blog/[id]/edit/page.tsx`:**
- Title (Input) — slug auto-generates from title (shown as preview, editable)
- Cover Image (UploadThing upload with preview)
- Excerpt (Textarea, optional)
- Content (Tiptap editor — full-featured with image uploads inside the editor)
- Published toggle (Switch)
- Save as Draft / Publish buttons
- Form validation (title and content required)

**13h. Social Links `/admin/social/page.tsx`:**
- Simple form with an input for each social platform (LinkedIn, GitHub, Twitter, Instagram)
- Pre-filled with current values
- Save button that PUTs all links at once

### STEP 14: Public Site Migration

Convert the portfolio sections from reading static TypeScript imports to fetching from the database. **The existing client-side components, animations, and styling must remain identical.** The strategy is:

- Create **Server Component wrappers** that fetch data from Prisma
- Pass the data as props to the existing **Client Components**
- The client components stay as `"use client"` with all their Framer Motion animations

**14a. Update `src/sections/About.tsx`:**

Split into a Server Component wrapper and a Client Component:

```tsx
// src/sections/About.tsx (Server Component — remove "use client")
import prisma from "@/lib/prisma";
import AboutClient from "./AboutClient";

const About = async () => {
  const about = await prisma.about.findFirst();
  return <AboutClient about={about} />;
};
export default About;
```

Create `src/sections/AboutClient.tsx` with the existing animated JSX, but receiving `about` as a prop instead of using hardcoded text. Render the bio HTML using `dangerouslySetInnerHTML` (it's sanitized on save). Use the `profilePicUrl` and `resumeUrl` from the database.

**14b. Update `src/sections/Projects.tsx`:**

Same pattern — Server Component fetches, Client Component renders:

```tsx
// src/sections/Projects.tsx (Server Component)
import prisma from "@/lib/prisma";
import ProjectsClient from "./ProjectsClient";

const Projects = async () => {
  const featured = await prisma.project.findMany({
    where: { featured: true },
    orderBy: { order: "asc" },
  });
  const other = await prisma.project.findMany({
    where: { featured: false },
    orderBy: { order: "asc" },
  });
  return <ProjectsClient featured={featured} other={other} />;
};
export default Projects;
```

Create `src/sections/ProjectsClient.tsx` with the existing animated JSX. The `ProjectCard` component and its compound pattern stay unchanged — they already accept `ProjectDataType` which matches the Prisma model shape.

**14c. Update `src/sections/Skills.tsx`:**

```tsx
// src/sections/Skills.tsx (Server Component)
import prisma from "@/lib/prisma";
import SkillsClient from "./SkillsClient";

const Skills = async () => {
  const skills = await prisma.skill.findMany({ orderBy: { order: "asc" } });
  return <SkillsClient skills={skills} />;
};
export default Skills;
```

Create `src/sections/SkillsClient.tsx`. Use the `getIcon()` function from `src/lib/icon-map.ts` to resolve `iconName` strings to actual components. The SkillCard rendering stays the same.

**14d. Update `src/app/(public)/portfolio/page.tsx`:**

Since the sections are now Server Components (they use async/await with Prisma), the portfolio page must also become a Server Component. Remove the `"use client"` directive. The `FloatNav` and `ScrollToTop` can remain dynamically imported client components.

```tsx
// src/app/(public)/portfolio/page.tsx (Server Component — remove "use client")
import MaxWidth from "@/components/general/MaxWidth";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { navLinksData } from "@/data/navlinks";
import About from "@/sections/About";
import Contact from "@/sections/Contact";
import Projects from "@/sections/Projects";
import Skills from "@/sections/Skills";
import dynamic from "next/dynamic";

const FloatNav = dynamic(() => import("@/components/layout/navbar/FloatNav"), {
  ssr: false,
});

const PortfolioPage = () => {
  return (
    <div className="w-screen min-h-[calc(100svh-2rem)] overflow-x-hidden">
      <FloatNav data={navLinksData} />
      <ScrollToTop />
      <MaxWidth className="lg:!max-w-[65rem] md:!max-w-[40rem] mb-24 w-[90%] mx-auto">
        {/* @ts-expect-error Async Server Component */}
        <About />
        <div className="divider" />
        {/* @ts-expect-error Async Server Component */}
        <Projects />
        <div className="divider" />
        {/* @ts-expect-error Async Server Component */}
        <Skills />
        <div className="divider" />
        <Contact />
      </MaxWidth>
    </div>
  );
};

export default PortfolioPage;
```

Note: With Next.js 14+ and proper TypeScript setup, you may not need the `@ts-expect-error` comments. Remove them if types resolve correctly.

**14e. Build public blog pages:**

`src/app/(public)/blog/page.tsx` — Replace "Coming Soon" with a real blog listing:
- Fetch all published posts from Prisma (`where: { published: true }`, ordered by `publishedAt desc`)
- Display as a grid of blog cards (cover image, title, excerpt, date)
- Link each card to `/blog/[slug]`
- If no published posts, show a "No posts yet" message
- Style consistently with the portfolio (use Tailwind, dark mode support)

`src/app/(public)/blog/[slug]/page.tsx` — Blog post page:
- Fetch post by slug from Prisma
- If not found or not published, return `notFound()`
- Render: cover image (full width), title, publish date, content HTML (via `dangerouslySetInnerHTML`)
- Add Tiptap content styles (create `src/app/tiptap-content.css` or add `.tiptap-content` styles to `globals.css` for prose-like rendering of headings, lists, code blocks, images, links, etc.)
- Generate static params with `generateStaticParams` for published posts
- Add proper metadata (title, description from excerpt)

### STEP 15: Update next.config.mjs

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io", // UploadThing
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh", // UploadThing alternate domain
      },
    ],
  },
};

export default nextConfig;
```

### STEP 16: Polish & Final Touches

1. **Loading states**: Add `loading.tsx` files in admin routes with skeleton loaders
2. **Error boundaries**: Add `error.tsx` files in admin routes with user-friendly error messages
3. **Toast notifications**: Use Sonner (already installed) for all CRUD success/error feedback
4. **Tiptap content styles**: Add CSS for rendered Tiptap HTML on public blog posts (headings, lists, code blocks, blockquotes, images, links should have proper styling)
5. **Responsive admin**: Ensure admin sidebar collapses to a hamburger menu on mobile
6. **DOMPurify**: Sanitize all Tiptap HTML before storing in database (in API routes)
7. **Revalidation**: After any admin CRUD operation, call `revalidatePath()` or `revalidateTag()` to update the public-facing pages. This ensures that changes in admin are reflected immediately on the public site.

---

## 4. VERIFICATION CHECKLIST

After completing all steps, verify:

- [ ] `npx prisma db push` succeeds
- [ ] `npx prisma db seed` populates all data
- [ ] Public site at `/` renders landing page identically
- [ ] Public site at `/portfolio` renders all sections with data from DB
- [ ] All Framer Motion animations work as before
- [ ] Dark/light mode toggle works on all pages
- [ ] `/admin/login` shows login form
- [ ] Cannot access `/admin` without logging in (redirects to login)
- [ ] Can log in with seeded admin credentials
- [ ] Admin dashboard shows content counts
- [ ] Can create, edit, and delete projects (with image upload)
- [ ] Can create, edit, and delete skills (with icon picker)
- [ ] Can edit About section (bio with Tiptap, profile pic, resume)
- [ ] Can create, edit, delete, and publish/unpublish blog posts
- [ ] Can edit social links
- [ ] Blog listing at `/blog` shows published posts
- [ ] Individual blog post at `/blog/[slug]` renders content correctly
- [ ] Changes made in admin are reflected on the public site
- [ ] UploadThing uploads work for images, videos, and PDFs
- [ ] Tiptap editor works with all formatting options and image inserts
- [ ] API routes return 401 for unauthenticated requests
- [ ] Mobile responsive: admin sidebar collapses, forms stack vertically

---

## 5. IMPORTANT NOTES

- **DO NOT break existing functionality.** The public portfolio must work identically after migration — same animations, same styling, same dark mode, same responsive behavior.
- **Keep existing components.** The `ProjectCard` compound component pattern, all animation variants, the `MaxWidth` wrapper, `FloatNav`, `ScrollToTop` — all stay as-is. Only change data sources.
- **The `src/data/` files can remain** as a reference/fallback, but sections should read from the database.
- **Use Server Components** for data fetching (sections, blog pages). Keep Client Components for interactivity (animations, forms, admin pages).
- **Shadcn UI** is already partially installed (Button, Input, Sonner). Use `npx shadcn@latest add <component>` for additional components.
- **Path alias** `@/*` maps to `./src/*` (configured in tsconfig.json).

## PROMPT END
