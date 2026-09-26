/**
 * Remounts on every route change, so the CSS entry animation replays.
 * The animation leaves no transform behind (see .page-enter in admin.css),
 * which keeps position:fixed children (editor fullscreen, mobile save bar) intact.
 */
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
