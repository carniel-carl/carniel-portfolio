/**
 * Admin z-index scale. Full class strings so Tailwind can see them.
 *
 * 20  pinned header
 * 30  sidebar (set in components/ui/sidebar.tsx), mobile form save bar
 * 50  overlays: dialogs, sheets, menus, popovers (Radix/shadcn defaults)
 * 200 editor fullscreen (TiptapEditor)
 */
export const adminZ = {
  header: "z-20",
  mobileBar: "z-30",
} as const;
