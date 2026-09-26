"use client";

import { useEffect, useRef } from "react";

/**
 * ⌘S / Ctrl+S submits, and closing the tab with unsaved changes asks first.
 */
export function useFormShortcuts({ onSave, dirty }: { onSave: () => void; dirty: boolean }) {
  const saveRef = useRef(onSave);
  useEffect(() => {
    saveRef.current = onSave;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        saveRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}
