import SocialLinks from "@/components/layout/navbar/SocialLinks";
import SiteFooter from "@/components/layout/SiteFooter";
import SmoothScroll from "@/components/motion/SmoothScroll";
import SoundPlayerLazy from "@/components/general/SoundPlayerLazy";
import { Suspense } from "react";
import SkipLink from "@/components/layout/SkipLink";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <SkipLink />
      <div aria-hidden="true" className="grain" />
      <SocialLinks />
      <SoundPlayerLazy />
      {/* Spacer for the fixed header */}
      <div className="h-14" />
      <main
        id="main"
        tabIndex={-1}
        className="relative min-h-[100dvh] bg-background outline-none"
      >
        <Suspense fallback={null}>{children}</Suspense>
      </main>
      <Suspense fallback={null}>
        <SiteFooter />
      </Suspense>
    </SmoothScroll>
  );
}
