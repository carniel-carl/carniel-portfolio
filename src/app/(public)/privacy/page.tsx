import type { Metadata } from "next";
import Link from "next/link";
import routes from "@/lib/routes";

export const metadata: Metadata = {
  title: "Privacy Policy | Chimezie's Portfolio",
  description:
    "How carniel.vercel.app collects, uses and protects information about visitors.",
};

const LAST_UPDATED = "September 27, 2026";

const sections = [
  {
    id: "overview",
    title: "Overview",
    body: (
      <>
        <p>
          This is the personal portfolio and blog of Nmugha Chimezie (Carniel),
          available at carniel.vercel.app (the &ldquo;site&rdquo;). This policy
          explains what information is collected when you visit, why, and the
          choices you have. I keep collection to what the site needs to work
          and to understand how it is used.
        </p>
      </>
    ),
  },
  {
    id: "information-you-give",
    title: "Information you give me",
    body: (
      <>
        <p>
          When you use the contact form, you send me your name, email address
          and message. The form is handled by{" "}
          <a href="https://formspree.io/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
            Formspree
          </a>
          , which delivers it to my inbox. I use these details only to reply to
          you and never sell them or add you to a mailing list.
        </p>
      </>
    ),
  },
  {
    id: "analytics",
    title: "Analytics",
    body: (
      <>
        <p>
          The site uses{" "}
          <a href="https://mixpanel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
            Mixpanel
          </a>{" "}
          to understand how it is used: for example, which pages and blog posts
          are viewed, which links are clicked, and general device information
          such as browser and screen type. Mixpanel stores a random identifier in
          your browser&rsquo;s local storage so repeat visits can be counted.
          This data is processed on Mixpanel&rsquo;s EU servers and is not used
          to identify you personally.
        </p>
      </>
    ),
  },
  {
    id: "advertising",
    title: "Advertising",
    body: (
      <>
        <p>
          Some pages may show ads served by Google AdSense. Google and its
          partners use cookies to serve ads based on your previous visits to
          this and other websites. Google&rsquo;s use of advertising cookies
          enables it and its partners to serve ads to you based on your visits
          to this site and/or other sites on the Internet.
        </p>
        <p>
          You can opt out of personalised advertising in{" "}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
            Google Ads Settings
          </a>
          , or opt out of some third-party vendors&rsquo; cookies at{" "}
          <a href="https://www.aboutads.info/choices" target="_blank" rel="noopener noreferrer">
            aboutads.info
          </a>
          . To learn more, see{" "}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
            how Google uses information from sites that use its services
          </a>
          . If you are in the EEA, the UK or Switzerland, you will be asked for
          consent before personalised ads are shown.
        </p>
      </>
    ),
  },
  {
    id: "spotify",
    title: "Spotify",
    body: (
      <>
        <p>
          The music player lets you optionally connect your Spotify account to
          play your own playlists. If you connect, Spotify asks for permission
          to read your playlists and profile. The access token Spotify returns is
          stored only in your browser and is never sent to or stored on my
          servers. You can disconnect at any time from the player, or revoke
          access in your{" "}
          <a href="https://www.spotify.com/account/apps/" target="_blank" rel="noopener noreferrer">
            Spotify account settings
          </a>
          . Playback uses Spotify&rsquo;s embedded player, which is covered by{" "}
          <a href="https://www.spotify.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">
            Spotify&rsquo;s privacy policy
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "cookies-storage",
    title: "Cookies and local storage",
    body: (
      <>
        <p>Besides the services above, the site stores a few things in your browser to remember your preferences:</p>
        <ul>
          <li>your light or dark theme choice</li>
          <li>your chosen music track and connected Spotify playlist</li>
          <li>your recent blog searches</li>
        </ul>
        <p>
          These stay on your device. You can clear them at any time through your
          browser settings, and the site will still work without them.
        </p>
      </>
    ),
  },
  {
    id: "third-parties",
    title: "Hosting and third parties",
    body: (
      <>
        <p>
          The site is hosted on{" "}
          <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
            Vercel
          </a>
          , which processes standard request data such as IP addresses to
          deliver pages and keep the service secure. Images are served through
          UploadThing. Each of these providers handles data under its own
          privacy policy. I do not sell your personal information to anyone.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>
          Depending on where you live, you may have the right to access,
          correct or delete personal information I hold about you, or to object
          to how it is used. To make a request, send a message through the{" "}
          <Link href={`${routes.public.portfolio}#contact`}>contact form</Link>{" "}
          and I will respond as soon as I can.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        This site is not directed at children under 13, and I do not knowingly
        collect personal information from them.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        I may update this policy as the site changes. The date at the top shows
        when it was last revised.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-[90%] max-w-3xl pb-24 pt-12 md:pb-32 md:pt-16">
      <header className="mb-10 border-b pb-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated {LAST_UPDATED}
        </p>
      </header>

      <div className="flex flex-col gap-10 text-foreground/80 leading-relaxed [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-accent-ink [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-4 [&_ul]:my-3 [&_ul]:space-y-1">
        {sections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}>
            <h2
              id={`${section.id}-title`}
              className="mb-3 text-xl font-semibold text-foreground"
            >
              {section.title}
            </h2>
            {section.body}
          </section>
        ))}
      </div>
    </div>
  );
}
