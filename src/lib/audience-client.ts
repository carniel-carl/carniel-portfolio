"use client";

// Browser side of kids mode: the session cookie, a hook that follows it, and
// the grown-up check's question and lockout. See lib/audience.ts.
import { useSyncExternalStore } from "react";
import { AUDIENCE_COOKIE, isAudience, type Audience } from "@/lib/audience";

const CHANGE_EVENT = "audiencechange";

function readCookie(name: string) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** No maxAge makes a session cookie: it ends when the browser closes */
function writeCookie(name: string, value: string, maxAge?: number) {
  const age = maxAge === undefined ? "" : `; Max-Age=${maxAge}`;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${age}${secure}`;
}

export function getAudience(): Audience | null {
  if (typeof document === "undefined") return null;
  const value = readCookie(AUDIENCE_COOKIE);
  return isAudience(value) ? value : null;
}

export function setAudience(audience: Audience) {
  writeCookie(AUDIENCE_COOKIE, audience);
  document.documentElement.dataset.audience = audience;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Cookies fire no change event, so re-read when the tab regains focus: another
// tab may have switched kids mode off meanwhile
function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("focus", onChange);
  };
}

/** This session's answer; null while hydrating and until someone answers */
export function useAudience() {
  return useSyncExternalStore(subscribe, getAudience, () => null);
}

// ─── Grown-up check ─────────────────────────────────────────────────────────
// Until a parent PIN is set on the device, grown-ups answer a two-digit by
// two-digit multiplication written in words: beyond mental maths for most
// under-12s, the audience of a kids series. Wrong answers (and wrong PINs)
// count across tabs in a short-lived cookie; after GATE_TRIES the check locks
// for GATE_LOCK_SECONDS, so it can't be guessed by hammering it.

export const GATE_TRIES = 3;
const GATE_LOCK_SECONDS = 300;
const GATE_COOKIE = "audience-gate";

const UNITS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const TEENS = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty"];

/** 10–49 in words, e.g. 34 → "thirty-four" */
const inWords = (n: number) =>
  n < 20 ? TEENS[n - 10] : `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${UNITS[n % 10]}` : ""}`;

const randomInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

export type GateQuestion = { text: string; answer: number };

export function newGateQuestion(previous?: GateQuestion): GateQuestion {
  let question: GateQuestion;
  do {
    let a = randomInt(21, 49);
    if (a % 10 === 0) a += 1; // round tens are too easy
    const b = randomInt(12, 19);
    question = { text: `${inWords(a)} times ${inWords(b)}`, answer: a * b };
  } while (previous && question.text === previous.text);
  return question;
}

// ─── Parent PIN ─────────────────────────────────────────────────────────────
// Optional and per device: once set, it replaces the question everywhere
// (choosing "grown-up" and switching kids mode off). It lives in localStorage
// so it outlasts the browser session. Stored hashed only so it isn't readable
// at a glance; a 4-digit PIN is no secret from someone who opens devtools, and
// clearing the site's data removes it, which is the "forgot my PIN" path.

const PIN_KEY = "kids-pin";
export const PIN_LENGTH = 4;

// FNV-1a: synchronous and available on plain-http LAN addresses, unlike crypto.subtle
function hashPin(pin: string) {
  let h = 0x811c9dc5;
  for (const ch of `kids-pin:${pin}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16);
}

export function hasPin() {
  try {
    return !!localStorage.getItem(PIN_KEY);
  } catch {
    return false;
  }
}

export function savePin(pin: string) {
  try {
    localStorage.setItem(PIN_KEY, hashPin(pin));
    return true;
  } catch {
    return false;
  }
}

export function checkPin(pin: string) {
  try {
    return localStorage.getItem(PIN_KEY) === hashPin(pin);
  } catch {
    return false;
  }
}

export type GateState = { fails: number; lockedUntil: number };

export function readGate(): GateState {
  const [fails, lockedUntil] = (readCookie(GATE_COOKIE) ?? "").split(".").map(Number);
  return { fails: fails || 0, lockedUntil: lockedUntil || 0 };
}

export function recordGateFail(): GateState {
  const fails = readGate().fails + 1;
  const lockedUntil = fails >= GATE_TRIES ? Date.now() + GATE_LOCK_SECONDS * 1000 : 0;
  // The cookie expires with the lock, which resets the count
  writeCookie(GATE_COOKIE, `${fails}.${lockedUntil}`, GATE_LOCK_SECONDS);
  return { fails, lockedUntil };
}

export function clearGate() {
  writeCookie(GATE_COOKIE, "", 0);
}
