"use client";

import { useEffect, useState } from "react";
import { Shield } from "@/components/kids/KidsArt";
import {
  checkPin,
  clearGate,
  GATE_TRIES,
  hasPin,
  newGateQuestion,
  PIN_LENGTH,
  readGate,
  recordGateFail,
  type GateQuestion,
} from "@/lib/audience-client";

const countdown = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/**
 * The parent PIN when this device has one, otherwise a multiplication a young
 * child can't work out in their head. A wrong answer swaps in a new question;
 * GATE_TRIES wrong answers or PINs lock it for a few minutes, across tabs.
 */
export default function GrownUpCheck({
  headingId,
  descriptionId,
  intro,
  backLabel,
  onBack,
  onPass,
}: {
  headingId: string;
  descriptionId: string;
  intro: string;
  backLabel: string;
  onBack: () => void;
  onPass: () => void;
}) {
  const [pinMode] = useState(hasPin);
  const [question, setQuestion] = useState<GateQuestion>(() => newGateQuestion());
  const [value, setValue] = useState("");
  const [gate, setGate] = useState(readGate);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  const [shakes, setShakes] = useState(0);
  const locked = gate.lockedUntil > now;

  useEffect(() => {
    if (!gate.lockedUntil) return;
    const id = window.setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= gate.lockedUntil) {
        setGate(readGate());
        setError("");
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [gate.lockedUntil]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || !value.trim()) return;

    if (pinMode ? checkPin(value) : Number(value) === question.answer) {
      clearGate();
      onPass();
      return;
    }

    const next = recordGateFail();
    setGate(next);
    setNow(Date.now());
    setValue("");
    if (!pinMode) setQuestion((q) => newGateQuestion(q));
    setShakes((n) => n + 1);
    const left = GATE_TRIES - next.fails;
    const tries = `${left} ${left === 1 ? "try" : "tries"} left.`;
    setError(left > 0 ? (pinMode ? `That's not the PIN. ${tries}` : `Not quite. Here's a new one. ${tries}`) : "");
  };

  return (
    <div className="flex flex-col items-center text-center">
      <Shield className="size-14" />
      <h2
        id={headingId}
        className="font-playful mt-4 text-balance text-[clamp(1.9rem,6vw,2.5rem)] leading-[1.05] tracking-[-0.02em]"
      >
        {pinMode ? "Parent PIN, please" : "Quick grown-up check"}
      </h2>
      <p id={descriptionId} className="mt-3 max-w-[36ch] text-pretty text-foreground/70">
        {intro}
      </p>

      <form onSubmit={submit} className="mt-7 flex w-full flex-col gap-3">
        {locked ? (
          <p
            role="status"
            className="rounded-[1.25rem] bg-[hsl(var(--kid-coral)/0.18)] px-5 py-4 text-pretty font-medium"
          >
            Too many tries. Ask a grown-up to help, or try again in{" "}
            <span className="tnum font-mono">{countdown(gate.lockedUntil - now)}</span>.
          </p>
        ) : (
          <>
            <label htmlFor="grown-up-answer" className="text-lg">
              {pinMode ? (
                "Enter the PIN set on this device"
              ) : (
                <>
                  What is <strong className="font-semibold">{question.text}</strong>?
                </>
              )}
            </label>
            <input
              key={shakes}
              id="grown-up-answer"
              autoFocus
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              type={pinMode ? "password" : "text"}
              maxLength={pinMode ? PIN_LENGTH : 4}
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
              aria-invalid={!!error}
              aria-describedby={error ? "grown-up-error" : undefined}
              placeholder={pinMode ? "••••" : "?"}
              className="h-16 w-full rounded-[1.25rem] border-2 border-foreground/15 bg-background text-center font-mono text-3xl tabular-nums caret-accent outline-none transition-colors placeholder:text-foreground/30 focus:border-accent-ink dark:focus:border-accent"
              style={shakes ? { animation: "kid-shake 0.4s ease-in-out" } : undefined}
            />
          </>
        )}
        <p id="grown-up-error" aria-live="polite" className="min-h-5 text-sm font-medium text-foreground/75">
          {error}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-12 items-center justify-center rounded-full border border-foreground/15 px-4 font-medium transition-colors hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {backLabel}
          </button>
          <button
            type="submit"
            disabled={locked || !value}
            className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-4 font-semibold text-background transition-[transform,opacity] active:scale-[0.97] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Check
          </button>
        </div>
        {pinMode && (
          <p className="mt-2 text-pretty text-xs leading-relaxed text-foreground/55">
            Forgot it? Clearing this site&rsquo;s data in your browser settings removes the PIN.
          </p>
        )}
      </form>
    </div>
  );
}
