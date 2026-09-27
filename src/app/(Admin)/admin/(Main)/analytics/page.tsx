import RankedList from "@/components/admin/analytics/RankedList";
import { RefreshAnalyticsButton } from "@/components/admin/RefreshAnalyticsButton";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import StatTile from "@/components/admin/ui/StatTile";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getAnalyticsSnapshot } from "@/lib/mixpanel-server";
import dayjs from "dayjs";
import {
  BookOpen,
  Download,
  Eye,
  FileText,
  FolderKanban,
  Globe2,
  MapPin,
  Megaphone,
  MousePointerClick,
  Search,
  Send,
  Share2,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";

export const metadata: Metadata = { title: "Analytics" };

async function getAnalyticsData() {
  "use cache";
  cacheTag(CACHE_TAGS.analytics);
  cacheLife("hours");
  return getAnalyticsSnapshot(30);
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
function countryName(code: string) {
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

function humanize(slug: string) {
  return slug.replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();
  const count = (event: string) =>
    data.eventCounts.find((e) => e.event === event)?.count ?? 0;

  const home = count("Home Viewed");
  const portfolio = count("Portfolio Viewed");
  const postReads = count("Blog Post Viewed");
  const blogIndex = count("Blog Page Viewed");
  const categoryViews = count("Blog Category Viewed");
  const socialClicks = count("Social Link Clicked");
  const projectClicks = count("Project Link Clicked");
  const shares = count("Blog Post Shared");
  const searchOpens = count("Blog Search Result Opened");
  const authorClicks = count("Author Card Clicked");
  const heroCta = count("Home CTA Clicked");
  const footerCta = count("Footer CTA Clicked");
  const authorTo = (target: string) =>
    data.authorCardTargets.find((t) => t.label === target)?.count ?? 0;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Analytics"
        description={`${dayjs(data.from_date).format("D MMM")} to ${dayjs(data.to_date).format("D MMM YYYY")}. Refreshed hourly.`}
        actions={<RefreshAnalyticsButton />}
      />

      <section aria-label="Totals" className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Site visits"
          value={(home + portfolio).toLocaleString()}
          icon={Eye}
          detail={`${home.toLocaleString()} home, ${portfolio.toLocaleString()} portfolio`}
        />
        <StatTile
          label="Post reads"
          value={postReads.toLocaleString()}
          icon={BookOpen}
          detail={`${blogIndex.toLocaleString()} blog index, ${categoryViews.toLocaleString()} category views`}
        />
        <StatTile
          label="Resume downloads"
          value={count("Resume Downloaded").toLocaleString()}
          icon={Download}
          detail="From the about section"
        />
        <StatTile
          label="Outbound clicks"
          value={(socialClicks + projectClicks).toLocaleString()}
          icon={MousePointerClick}
          detail={`${projectClicks.toLocaleString()} project, ${socialClicks.toLocaleString()} social`}
        />
      </section>

      <section aria-labelledby="engagement" className="space-y-3">
        <h2 id="engagement" className="text-sm font-semibold">
          Engagement
        </h2>
        <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Post shares"
            value={shares.toLocaleString()}
            icon={Send}
            detail="Copy link, X, LinkedIn, WhatsApp"
          />
          <StatTile
            label="Search opens"
            value={searchOpens.toLocaleString()}
            icon={Search}
            detail="Posts opened from blog search"
          />
          <StatTile
            label="Author card clicks"
            value={authorClicks.toLocaleString()}
            icon={UserRound}
            detail={`${authorTo("home").toLocaleString()} to home, ${authorTo("portfolio").toLocaleString()} to portfolio`}
          />
          <StatTile
            label="CTA clicks"
            value={(heroCta + footerCta).toLocaleString()}
            icon={Megaphone}
            detail={`${heroCta.toLocaleString()} hero "View work", ${footerCta.toLocaleString()} footer "Get in touch"`}
          />
        </div>
      </section>

      {/* grid-cols-1 (minmax(0,1fr)): an implicit mobile column grows to the
          longest un-wrappable label and the admin shell clips the overflow */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RankedList
          title="Most read posts"
          unit="reads"
          icon={FileText}
          emptyText="Post reads will appear once someone opens an article."
          rows={data.topPosts.map((p) => ({ label: humanize(p.slug), value: p.count }))}
        />
        <RankedList
          title="Most clicked projects"
          unit="clicks"
          icon={FolderKanban}
          emptyText="Clicks on live demos and repos will show up here."
          rows={data.topProjects.map((p) => ({ label: p.project, value: p.total }))}
        />
        <RankedList
          title="Visitors by country"
          unit="visits"
          icon={Globe2}
          emptyText="No location data for this period."
          rows={data.locations.map((l) => ({ label: countryName(l.country), value: l.count }))}
        />
        <RankedList
          title="Visitors by region"
          unit="visits"
          icon={MapPin}
          emptyText="No region data for this period."
          rows={data.regions.map((r) => ({ label: r.region, value: r.count }))}
        />
        <RankedList
          title="Top searches"
          unit="opens"
          icon={Search}
          emptyText="Search terms show up once readers open a post from search."
          rows={data.topSearches.map((q) => ({ label: `“${q.label}”`, value: q.count }))}
        />
        <RankedList
          title="Most shared posts"
          unit="shares"
          icon={Send}
          emptyText="Shared posts will appear here."
          rows={data.topSharedPosts.map((p) => ({ label: humanize(p.label), value: p.count }))}
        />
        <RankedList
          title="Shares by platform"
          unit="shares"
          icon={Share2}
          emptyText="No posts have been shared in this period."
          rows={data.sharesByPlatform.map((p) => ({ label: p.label, value: p.count }))}
        />
      </div>

      <section aria-labelledby="social-clicks" className="surface p-5">
        <h2 id="social-clicks" className="mb-4 text-sm font-semibold">
          Social profile clicks
        </h2>
        {data.socialClicks.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Share2 className="size-4" />
            No one has clicked a social link in this period.
          </p>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {data.socialClicks.map((s) => (
              <div key={s.platform} className="space-y-1">
                <dt className="text-[13px] capitalize text-muted-foreground">{s.platform}</dt>
                <dd className="tnum font-display text-2xl font-semibold tracking-tight">
                  {s.count.toLocaleString()}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  );
}
