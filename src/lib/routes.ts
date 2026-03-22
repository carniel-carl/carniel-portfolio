const routes = {
  public: {
    home: "/",
    portfolio: "/portfolio",
    blog: "/blog",
    blogPost: (slug: string) => `/blog/${slug}`,
  },
  admin: {
    dashboard: "/admin",
    login: "/admin/login",
    analytics: "/admin/analytics",
    projects: "/admin/projects",
    skills: "/admin/skills",
    about: "/admin/about",
    blog: "/admin/blog",
    blogCategories: "/admin/blog/categories",
    social: "/admin/social",
    users: "/admin/users",
    blogPreview: (id: string) => `/admin/blog/${id}/preview`,
    blogEdit: (id: string) => `/admin/blog/${id}/edit`,
    blogNew: "/admin/blog/new",
    projectEdit: (id: string) => `/admin/projects/${id}/edit`,
    projectNew: "/admin/projects/new",
  },
};

export default routes;
