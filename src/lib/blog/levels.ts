// Difficulty levels for posts and series episodes. Plain data, so client and
// server code (and the MCP tools) share one list.

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS: Record<Level, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const isLevel = (value: unknown): value is Level =>
  typeof value === "string" && (LEVELS as readonly string[]).includes(value);

export const levelLabel = (value: string | null | undefined) =>
  isLevel(value) ? LEVEL_LABELS[value] : null;

/** "Beginner to Advanced" for the span of levels a series covers, or null when none are set. */
export function levelRange(levels: (string | null | undefined)[]) {
  const ranks = levels.filter(isLevel).map((l) => LEVELS.indexOf(l));
  if (ranks.length === 0) return null;
  const low = LEVEL_LABELS[LEVELS[Math.min(...ranks)]];
  const high = LEVEL_LABELS[LEVELS[Math.max(...ranks)]];
  return low === high ? low : `${low} to ${high}`;
}
