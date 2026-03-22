import SocialLinks from "@/components/layout/navbar/SocialLinks";
import Footer from "@/components/layout/Footer";
import { Suspense } from "react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="grid grid-rows-[3.5rem_1fr] ">
        <div>
          <SocialLinks />
        </div>
        <main className="row-start-2 row-end-3">
          <Suspense fallback={null}>{children}</Suspense>
        </main>
      </div>
      <Footer />
    </>
  );
}
