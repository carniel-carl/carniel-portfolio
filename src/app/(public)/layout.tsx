import SocialLinks from "@/components/layout/navbar/SocialLinks";
import SiteFooter from "@/components/layout/SiteFooter";
import SmoothScroll from "@/components/motion/SmoothScroll";
import SoundPlayer from "@/components/general/SoundPlayer";
import { Suspense } from "react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <div aria-hidden="true" className="grain" />
      <SocialLinks />
      <SoundPlayer />
      {/* Spacer for the fixed header */}
      <div className="h-14" />
      <main className="relative min-h-[100dvh] bg-background">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
      <Suspense fallback={null}>
        <SiteFooter />
      </Suspense>
    </SmoothScroll>
  );
}
