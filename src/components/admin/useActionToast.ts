"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

type Messages<T> = {
  loading: string;
  success: string | ((result: T) => string);
  /** Toast text for a thrown error; return null to show the error elsewhere instead */
  error: string | ((error: unknown) => string | null);
  /** Navigate here after the action instead of staying on the page */
  navigateTo?: string | ((result: T) => string);
};

// Longest the toast waits for fresh data before calling it done anyway
const REFRESH_TIMEOUT = 8000;

/**
 * One toast across a mutation's whole life: loading while the server action
 * runs and while the page refetches, success only once the new data is on
 * screen. A success toast fired straight after the action lands before
 * router.refresh() does, so the page still looks unchanged and the save
 * seems to have failed.
 *
 * `data` is a server-rendered prop of the calling component. A refresh hands
 * it a new object, which is the signal that the fetch has landed. Pages that
 * navigate away finish when they unmount or are hidden.
 */
export function useActionToast(data?: unknown) {
  const router = useRouter();
  const waiting = useRef(new Set<() => void>());

  const flush = useCallback(() => {
    const done = [...waiting.current];
    waiting.current.clear();
    done.forEach((fn) => fn());
  }, []);

  useEffect(flush, [data, flush]);
  useEffect(() => flush, [flush]);

  /** Resolves true once the change is visible, false if the action threw. */
  return useCallback(
    async <T>(task: () => Promise<T>, { loading, success, error, navigateTo }: Messages<T>) => {
      const id = toast.loading(loading);
      let result: T;
      try {
        result = await task();
      } catch (err) {
        const message = typeof error === "function" ? error(err) : error;
        if (message === null) toast.dismiss(id);
        else toast.error(message, { id });
        return false;
      }

      await new Promise<void>((resolve) => {
        const finish = () => {
          clearTimeout(timer);
          waiting.current.delete(finish);
          resolve();
        };
        const timer = setTimeout(finish, REFRESH_TIMEOUT);
        waiting.current.add(finish);
        if (navigateTo) router.push(typeof navigateTo === "function" ? navigateTo(result) : navigateTo);
        router.refresh();
      });

      toast.success(typeof success === "function" ? success(result) : success, { id });
      return true;
    },
    [router],
  );
}
