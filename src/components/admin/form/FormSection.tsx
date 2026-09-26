import { cn } from "@/lib/utils";

type FormSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export default function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section className={cn("surface", className)}>
      <header className="border-b px-5 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </header>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}

/** A labelled on/off row: text on the left, control on the right. */
export function ToggleRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {control}
    </div>
  );
}
