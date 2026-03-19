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
