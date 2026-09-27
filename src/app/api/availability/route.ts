import { getContactInfo } from "@/lib/data/portfolio";

// Current availability for the footer. The footer lives in the shared public
// layout, which the browser keeps across client-side navigations, so it
// re-checks here instead of showing what was true when the tab first loaded.
// getContactInfo is cached under the "about" tag, so this rarely hits the DB.
export async function GET() {
  return Response.json(await getContactInfo(), {
    headers: { "Cache-Control": "no-store" },
  });
}
