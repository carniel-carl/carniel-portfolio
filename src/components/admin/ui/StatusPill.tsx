export default function StatusPill({ published }: { published: boolean }) {
  return published ? (
    <span className="inline-flex shrink-0 items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-accent-ink">
      Live
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Draft
    </span>
  );
}
