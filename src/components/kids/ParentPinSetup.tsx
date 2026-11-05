"use client";

import { useState } from "react";
import { Shield } from "@/components/kids/KidsArt";
import { PIN_LENGTH, savePin } from "@/lib/audience-client";
import type { Audience } from "@/lib/audience";

const pinInput =
  "h-14 w-full rounded-[1.25rem] border-2 border-foreground/15 bg-background text-center font-mono text-2xl tracking-[0.4em] caret-accent outline-none transition-colors placeholder:tracking-[0.4em] placeholder:text-foreground/30 focus:border-accent-ink dark:focus:border-accent";
const ghostButton =
  "inline-flex h-12 items-center justify-center rounded-full border border-foreground/15 px-4 font-medium transition-colors hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
const solidButton =
  "inline-flex h-12 items-center justify-center rounded-full bg-foreground px-4 font-semibold text-background transition-[transform,opacity] active:scale-[0.97] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const digits = (value: string) => value.replace(/\D/g, "").slice(0, PIN_LENGTH);

/**
 * Offered once a grown-up passes the question on a device with no PIN yet.
 * After saving, the grown-up picks who reads next, so a parent can set the
 * PIN and hand the device straight to a child.
 */
export default function ParentPinSetup({
  headingId,
  descriptionId,
  labels,
  onDone,
}: {
  headingId: string;
  descriptionId: string;
  /** Button text for the two choices after saving */
  labels: Record<Audience, string>;
  onDone: (next: Audience) => void;
}) {
  const [pin, setPin] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== PIN_LENGTH) return setError(`The PIN needs ${PIN_LENGTH} digits.`);
    if (pin !== again) return setError("The two PINs don't match. Try typing them again.");
    if (!savePin(pin)) return setError("This browser won't save a PIN. Private windows often block it.");
    setSaved(true);
  };

  if (saved) {
    return (
      <div className="flex flex-col items-center text-center">
        <Shield className="size-14" />
        <h2
          id={headingId}
          className="font-playful mt-4 text-balance text-[clamp(1.9rem,6vw,2.5rem)] leading-[1.05] tracking-[-0.02em]"
        >
          PIN saved
        </h2>
        <p id={descriptionId} className="mt-3 max-w-[36ch] text-pretty text-foreground/70">
          From now on, this device asks for it instead of a question. Who&rsquo;s reading now?
        </p>
        <div className="mt-7 grid w-full grid-cols-2 gap-3">
          <button type="button" autoFocus onClick={() => onDone("adult")} className={ghostButton}>
            {labels.adult}
          </button>
          <button type="button" onClick={() => onDone("kid")} className={solidButton}>
            {labels.kid}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <Shield className="size-14" />
      <h2
        id={headingId}
        className="font-playful mt-4 text-balance text-[clamp(1.9rem,6vw,2.5rem)] leading-[1.05] tracking-[-0.02em]"
      >
        Set a parent PIN?
      </h2>
      <p id={descriptionId} className="mt-3 max-w-[38ch] text-pretty text-foreground/70">
        With a PIN, only someone who knows it can choose &ldquo;grown-up&rdquo; or switch kids mode
        off on this device. It stays after the browser closes.
      </p>

      <form onSubmit={submit} className="mt-7 flex w-full flex-col gap-3 text-left">
        <label htmlFor="pin-new" className="text-sm font-medium">
          New {PIN_LENGTH}-digit PIN
        </label>
        <input
          id="pin-new"
          autoFocus
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="new-password"
          maxLength={PIN_LENGTH}
          value={pin}
          onChange={(e) => {
            setPin(digits(e.target.value));
            setError("");
          }}
          placeholder="••••"
          className={pinInput}
        />
        <label htmlFor="pin-again" className="mt-1 text-sm font-medium">
          Type it again
        </label>
        <input
          id="pin-again"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="new-password"
          maxLength={PIN_LENGTH}
          value={again}
          onChange={(e) => {
            setAgain(digits(e.target.value));
            setError("");
          }}
          aria-invalid={!!error}
          aria-describedby={error ? "pin-error" : undefined}
          placeholder="••••"
          className={pinInput}
        />
        <p id="pin-error" aria-live="polite" className="min-h-5 text-center text-sm font-medium text-foreground/75">
          {error}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => onDone("adult")} className={ghostButton}>
            Skip
          </button>
          <button type="submit" disabled={pin.length !== PIN_LENGTH || !again} className={solidButton}>
            Save PIN
          </button>
        </div>
      </form>
    </div>
  );
}
