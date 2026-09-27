"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useIntroDone } from "@/components/layout/Intro";
import { JUST_CONNECTED_KEY } from "@/lib/spotify";

// The player (UI, Web Audio engine, Spotify client, Floating UI) is a large
// bundle nobody needs to read the page, so it isn't in the initial JS. It
// loads once the intro has lifted and the browser is idle, which is also
// when it would first appear anyway.
const SoundPlayer = dynamic(() => import("./SoundPlayer"), { ssr: false });

// Upper bound on the idle wait, so busy pages still get the player
const IDLE_TIMEOUT = 2500;

const justConnected = () => {
  try {
    return Boolean(sessionStorage.getItem(JUST_CONNECTED_KEY));
  } catch {
    return false;
  }
};

const SoundPlayerLazy = () => {
  const introDone = useIntroDone();
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (load) return;
    // Back from Spotify sign-in: the player reopens onto the playlists, so
    // don't make the visitor wait for idle time
    if (justConnected()) {
      setLoad(true);
      return;
    }
    if (!introDone) return;

    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(() => setLoad(true), { timeout: IDLE_TIMEOUT });
      return () => cancelIdleCallback(id);
    }
    // Safari has no requestIdleCallback
    const t = setTimeout(() => setLoad(true), 1200);
    return () => clearTimeout(t);
  }, [introDone, load]);

  return load ? <SoundPlayer /> : null;
};

export default SoundPlayerLazy;
