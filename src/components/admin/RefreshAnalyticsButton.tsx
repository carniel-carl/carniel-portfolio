"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { refreshAnalytics } from "@/lib/actions/analytics";
import { cn } from "@/lib/utils";

export function RefreshAnalyticsButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      className="hover:bg-muted"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await refreshAnalytics();
            toast.success("Analytics refreshed");
          } catch {
            toast.error("Could not reach Mixpanel. Try again in a minute.");
          }
        })
      }
    >
      <RefreshCw className={cn(isPending && "animate-spin")} />
      {isPending ? "Refreshing" : "Refresh"}
    </Button>
  );
}
