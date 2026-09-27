type ProjectDataType = {
  tag?: string;
  name: string;
  img: string;
  live?: string;
  code?: string;
  description: string;
  stack?: string[];
  // Mobile / team showcase (all optional; web projects can ignore them)
  platform?: "web" | "mobile" | "both";
  status?: "live" | "beta" | "prototype" | "internal" | "in-development";
  role?: string;
  team?: string;
  highlights?: string[];
  videoUrl?: string;
  posterUrl?: string;
  screenshots?: string[];
  appStoreUrl?: string;
  playStoreUrl?: string;
  betaUrl?: string;
};

export { ProjectDataType };
