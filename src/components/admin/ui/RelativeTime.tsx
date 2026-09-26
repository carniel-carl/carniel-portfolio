"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";

dayjs.extend(relativeTime);

/**
 * "3 days ago", computed in the browser. The server and first paint use a
 * fixed date: reading the clock while prerendering breaks cacheComponents
 * and would not match on hydration anyway.
 */
export default function RelativeTime({ date, className }: { date: string | Date; className?: string }) {
  const d = dayjs(date);
  const [label, setLabel] = useState(() => d.format("D MMM YYYY"));

  useEffect(() => {
    setLabel(d.fromNow());
    // Only re-derive when the timestamp itself changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.valueOf()]);

  return (
    <time dateTime={d.toISOString()} title={d.format("D MMM YYYY, HH:mm")} className={className}>
      {label}
    </time>
  );
}
