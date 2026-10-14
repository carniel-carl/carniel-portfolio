"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import GrownUpCheck from "@/components/kids/GrownUpCheck";
import { Mug, Rocket } from "@/components/kids/KidsArt";
import KidsDialog from "@/components/kids/KidsDialog";
import ParentPinSetup from "@/components/kids/ParentPinSetup";
import { KIDS_HOME, type Audience } from "@/lib/audience";
import { hasPin, setAudience, useAudience } from "@/lib/audience-client";

const TITLE_ID = "kids-prompt-title";
const DESCRIPTION_ID = "kids-prompt-description";

/**
 * "Who's reading today?" on a kids series and its episodes. Asked once per
 * browser session; a grown-up passes the grown-up check (or the device's
 * parent PIN), so a child can't skip kids mode with one tap. A device with no
 * PIN yet is offered one.
 */
export default function AudiencePrompt() {
  const audience = useAudience();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<"choose" | "check" | "pin">("choose");
  const [launching, setLaunching] = useState(false);
  const adultRef = useRef<HTMLButtonElement>(null);
  const returning = useRef(false);

  useEffect(() => setHydrated(true), []);

  // Back from the check: focus where the reader left
  useEffect(() => {
    if (step === "choose" && returning.current) adultRef.current?.focus();
  }, [step]);

  if (audience) return null;

  const finish = (choice: Audience) => {
    setAudience(choice);
    // Drops prefetched portfolio pages from the router cache, so the next
    // navigation to one goes through the proxy
    if (choice === "kid") router.refresh();
  };

  const chooseKid = () => {
    setLaunching(true);
    window.setTimeout(() => finish("kid"), reduce ? 0 : 750);
  };

  return (
    <KidsDialog
      labelledBy={TITLE_ID}
      describedBy={DESCRIPTION_ID}
      active={hydrated}
      leaving={launching}
      data-audience-prompt
    >
      <AnimatePresence mode="wait" initial={false}>
        {step === "choose" ? (
          <motion.div
            key="choose"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-col items-center text-center">
              <h2
                id={TITLE_ID}
                className="font-playful text-balance text-[clamp(2.1rem,7.5vw,3rem)] leading-[1] tracking-[-0.025em]"
              >
                Who&rsquo;s reading today?
              </h2>
              <p id={DESCRIPTION_ID} className="mt-3 max-w-[34ch] text-pretty text-lg leading-snug text-foreground/70">
                I made this series for young readers. Pick one and I&rsquo;ll set things up for you.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4">
              <Choice
                tone="sun"
                title="I’m a kid"
                note="Let’s start reading"
                disabled={launching}
                onClick={chooseKid}
                art={
                  <span className="block" style={{ animation: "kid-bob 2.4s ease-in-out infinite" }}>
                    <motion.span
                      className="block"
                      initial={false}
                      animate={launching ? { y: -150, rotate: -8, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
                      transition={{ duration: 0.7, ease: [0.55, 0, 0.75, 0] }}
                    >
                      <Rocket className="size-16" />
                    </motion.span>
                  </span>
                }
              />
              <Choice
                ref={adultRef}
                tone="sky"
                title="I’m a grown-up"
                note="Parent, teacher or curious reader"
                disabled={launching}
                onClick={() => {
                  returning.current = true;
                  setStep("check");
                }}
                art={<Mug className="size-16" />}
              />
            </div>

            <p className="mt-6 text-pretty text-center text-sm text-foreground/60">
              I&rsquo;ll remember this until the browser closes.{" "}
              <Link
                href={KIDS_HOME}
                className="font-medium text-foreground/80 underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
              >
                Not now
              </Link>
            </p>
          </motion.div>
        ) : step === "check" ? (
          <motion.div
            key="check"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <GrownUpCheck
              headingId={TITLE_ID}
              descriptionId={DESCRIPTION_ID}
              intro="Grown-ups only. Kids, tap Back and choose “I’m a kid”."
              backLabel="Back"
              onBack={() => setStep("choose")}
              onPass={() => (hasPin() ? finish("adult") : setStep("pin"))}
            />
          </motion.div>
        ) : (
          <motion.div
            key="pin"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <ParentPinSetup
              headingId={TITLE_ID}
              descriptionId={DESCRIPTION_ID}
              labels={{ adult: "Keep reading", kid: "Hand to a kid" }}
              onDone={finish}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </KidsDialog>
  );
}

function Choice({
  ref,
  tone,
  title,
  note,
  art,
  disabled,
  onClick,
}: {
  ref?: Ref<HTMLButtonElement>;
  tone: "sun" | "sky";
  title: string;
  note: string;
  art: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ "--tone": `var(--kid-${tone})` } as CSSProperties}
      className="group flex min-w-0 flex-col items-center gap-2 rounded-[1.5rem] border-2 border-[hsl(var(--tone)/0.55)] bg-[hsl(var(--tone)/0.14)] px-2.5 pb-5 pt-5 text-center transition-[transform,box-shadow,border-color] duration-500 ease-expo hover:-translate-y-1 hover:border-[hsl(var(--tone))] hover:shadow-[0_18px_30px_-18px_hsl(var(--tone))] active:translate-y-0 active:scale-[0.97] disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(var(--tone)/0.6)] sm:px-4"
    >
      <span className="mb-1 grid size-24 place-items-center rounded-full bg-[hsl(var(--tone)/0.35)] transition-transform dark:bg-[hsl(var(--tone)/0.55)] duration-500 ease-expo group-hover:scale-105 sm:size-28">
        {art}
      </span>
      <span className="font-playful text-[1.3rem] leading-tight sm:text-2xl">{title}</span>
      <span className="text-pretty text-sm leading-snug text-foreground/65">{note}</span>
    </button>
  );
}
