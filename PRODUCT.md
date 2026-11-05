# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, weighted equally:

- **Hiring teams**: recruiters and engineering leads deciding whether to interview Chimezie for a web or mobile role. They skim, open two or three projects, and download the resume.
- **Freelance clients**: founders and businesses deciding whether to hire Chimezie for a web or mobile build. They want to see shipped work, how he works, whether he is available, and how to get in touch.

## Product Purpose

The personal portfolio and blog of Nmugha Chimezie Carniel ("Carniel"), a web and mobile developer. Its job is to turn a visit into an interview request, a project inquiry, or a resume download. A visit counts as a success when the visitor leaves knowing what he builds, has seen proof in real shipped projects, and has a clear way to act.

## Positioning

He is a developer who came to code from art: he learned to build while making a website for his own art business. His work covers both web (React, Next.js) and native mobile (React Native, iOS and Android), with a craft-first standard of "fast, accessible apps that look as good as they work."

## Operating Context

- Content is managed from the site's own admin panel (`/admin`): projects (featured / other, web / mobile / both, status, role, team, highlights, screenshots, video, store links, case studies), skills (with icons), the about bio and portrait, resume PDF, social links, availability status and timezone, and blog posts with categories.
- Every public surface renders from that database, so layouts must handle any number of projects, missing images, long names, and empty states.
- Each project has a case-study page at `/work/[slug]`, and the blog lives at `/blog`.

## Capabilities and Constraints

- Next.js 16 App Router with Cache Components, React 19, Tailwind 3, Framer Motion, and Lenis smooth scrolling.
- Features that must keep working: the intro preloader (plays once per full load), the ambient sound player (generative soundscape with optional Spotify), the light/dark theme toggle with both themes designed, the availability badge with local time, resume download at `/resume`, the Formspree contact form, Mixpanel event tracking, view transitions into `/work/[slug]` and `/blog`, and JSON-LD / Open Graph metadata.
- Reduced-motion users get a fully readable, static page.

## Brand Commitments

- Name: "Chimezie Carniel" (SITE_NAME), short form "Carniel"; byline "Carniel".
- The existing logo mark (`public/images/logo.svg`) and favicon set.
- The black-and-white portrait (`public/images/profile-pic.jpg`, or the admin-uploaded `profilePicUrl`) stays as a key image.
- Voice: first person, plain, confident, no hype.

## Evidence on Hand

- Real projects from the database, including Link Pay (fintech), TechnoClean Dry Cleaners (landing page), Bisats (web3), and Alieaz (e-commerce), with cover images, stacks, and live/code links.
- Published blog posts with cover images (debugging, Next.js and TypeScript tutorials).
- Resume PDF, portrait, and the about bio (stored in the database).
- The site has no testimonials, client logos, metrics, or awards. Do not invent any. The stat counts on /portfolio are counted from the database.

## Product Principles

1. **Work first.** Shipped projects are the proof, so every surface gets a visitor to real work quickly.
2. **Both doors open.** Every surface offers a clear path for a hiring team (resume, role fit) and a client (contact, availability) without making either feel secondary.
3. **Craft is the claim.** The site itself is the demonstration of "looks as good as it works," so interaction quality, performance, and accessibility are part of the pitch.
4. **Admin-driven, never hard-coded.** Designs must survive whatever content the admin panel holds.

## Accessibility & Inclusion

WCAG AA contrast in both themes, full keyboard access with visible focus, a skip link, and a complete reduced-motion fallback for every scroll-driven or pinned sequence.
