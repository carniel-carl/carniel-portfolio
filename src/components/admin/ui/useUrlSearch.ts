"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

/**
 * A search field backed by the URL: typing updates `?q=` after a pause, so the
 * server does the filtering and the result is shareable and survives reloads.
 */
export function useUrlSearch(query: string, hrefFor: (query: string) => string) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [input, setInput] = useState(query);
  const pushed = useRef(query);
  const hrefRef = useRef(hrefFor);
  useEffect(() => {
    hrefRef.current = hrefFor;
  });

  // Back/forward changed the URL under the field; ignore our own updates
  useEffect(() => {
    if (query === pushed.current) return;
    pushed.current = query;
    setInput(query);
  }, [query]);

  useEffect(() => {
    const next = input.trim();
    if (next === pushed.current) return;
    const timer = setTimeout(() => {
      pushed.current = next;
      startTransition(() => router.replace(hrefRef.current(next)));
    }, 300);
    return () => clearTimeout(timer);
  }, [input, router]);

  /** Navigate within the list (tabs, pages) while keeping the old rows visible */
  const navigate = (href: string) => startTransition(() => router.push(href));

  return { input, setInput, pending, navigate };
}
