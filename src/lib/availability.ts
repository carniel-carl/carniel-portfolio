// Availability badge shown in the hero, footer and contact section.
// Edited in the admin About page; null hides the badge everywhere.
export const AVAILABILITY = {
  open: { label: "Available for new work", tone: "bg-emerald-500", pulse: true },
  limited: { label: "Limited availability", tone: "bg-amber-500", pulse: false },
  unavailable: { label: "Not taking new work", tone: "bg-foreground/40", pulse: false },
} as const;

export type Availability = keyof typeof AVAILABILITY;

export const isAvailability = (v: unknown): v is Availability =>
  typeof v === "string" && v in AVAILABILITY;

export type ContactInfo = {
  availability: Availability | null;
  availabilityNote: string | null;
  contactEmail: string | null;
  timezone: string | null;
};

// Invalid IANA names would make Intl throw at render time
export const isValidTimezone = (tz: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};
