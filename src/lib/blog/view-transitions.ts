// Shared names + classes for the blog list <-> post view transitions.
// Styles live under "BLOG VIEW TRANSITIONS" in globals.css.

// Transition types passed to <Link transitionTypes>
export const BLOG_FORWARD = "blog-forward";
export const BLOG_BACK = "blog-back";

// Elements with the same name on both pages morph into each other
export const blogCoverName = (slug: string) => `blog-cover-${slug}`;
export const blogTitleName = (slug: string) => `blog-title-${slug}`;

// Everything that isn't shared slides in the direction of travel.
// Untyped navigations (browser back/forward, navbar) just cross-fade.
export const blogPageTransition = {
  [BLOG_FORWARD]: "vt-page-forward",
  [BLOG_BACK]: "vt-page-back",
  default: "vt-page-fade",
};
