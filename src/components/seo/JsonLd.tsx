import { getAbout, getSocialLinks } from "@/lib/data/portfolio";
import { AUTHOR_NAME, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Escape "<" so no value can close the script tag
export const JsonLdScript = ({ data }: { data: object }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    }}
  />
);

// Person + WebSite graph: lets search engines show a proper name result
// with profile photo and linked social accounts
export const PersonJsonLd = async () => {
  const [about, socials] = await Promise.all([getAbout(), getSocialLinks()]);

  const person = {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: "Nmugha Chimezie Carniel",
    alternateName: [AUTHOR_NAME, SITE_NAME],
    url: SITE_URL,
    jobTitle: "Web and mobile developer",
    description: SITE_DESCRIPTION,
    // Structured data needs absolute URLs; local fallbacks are site-relative
    image: about?.profilePicUrl
      ? new URL(about.profilePicUrl, SITE_URL).toString()
      : undefined,
    // App deep links (e.g. instagram://) aren't valid profile URLs
    sameAs: socials.map((s) => s.link).filter((l) => l.startsWith("http")),
  };

  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@graph": [
          person,
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            name: SITE_NAME,
            url: SITE_URL,
            publisher: { "@id": `${SITE_URL}/#person` },
          },
        ],
      }}
    />
  );
};
