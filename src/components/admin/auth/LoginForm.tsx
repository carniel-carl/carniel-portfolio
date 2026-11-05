"use client";

import { AuthPortrait } from "@/components/admin/auth/AuthShell";
import { handleLogin } from "@/lib/actions/login";
import routes from "@/lib/routes";
import { LoginFormData, loginSchema } from "@/lib/schemas/login";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";

type Field = "email" | "password";

const spring = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.9,
} as const;

/**
 * Two stacked pills: the focused one swells and owns the accent disc, the
 * other rests small. Both inputs stay mounted so password managers can fill
 * them together.
 */
export default function LoginForm() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const shake = useAnimationControls();
  const [active, setActive] = useState<Field>("email");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    setFocus,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const errorFor = (field: Field) =>
    field === "email"
      ? errors.email?.message
      : (formError ?? errors.password?.message);
  const transition = reduceMotion ? { duration: 0 } : spring;

  // Swell a pill and focus its input; focus events alone can arrive late
  const go = (field: Field) => {
    setActive(field);
    setFocus(field);
  };

  const nudge = () => {
    if (!reduceMotion)
      shake.start({ x: [0, -9, 8, -5, 3, 0], transition: { duration: 0.42 } });
  };

  const signIn = handleSubmit(
    async (data) => {
      setFormError(null);
      const result = await handleLogin(data);
      if (result.error) {
        setFormError(result.message);
        nudge();
        go("password");
        return;
      }
      // The flood blooms from the disc, so the disc has to be on the password pill
      setActive("password");
      setSignedIn(true);
      // Only same-site admin paths, so ?next= can't bounce anyone off-site
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next?.startsWith("/admin/") ? next : routes.admin.dashboard);
      router.refresh();
    },
    (invalid) => {
      nudge();
      go(invalid.email ? "email" : "password");
    },
  );

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    // Enter on the email step moves on, unless a password manager filled both
    if (active === "email" && !getValues("password")) {
      e.preventDefault();
      setFormError(null);
      if (await trigger("email")) go("password");
      else nudge();
      return;
    }
    await signIn(e);
  };

  const pill = (field: Field) => {
    const on = active === field;
    return cn(
      "relative mx-auto flex w-full cursor-text items-center overflow-hidden border text-left transition-[border-color,background-color,box-shadow] duration-300",
      on
        ? "h-[4.5rem] max-w-[40rem] border-[hsl(var(--accent)/0.55)] bg-card pl-6 pr-2 shadow-[0_22px_60px_-28px_hsl(var(--accent)/0.55)] focus-within:ring-4 focus-within:ring-[hsl(var(--accent)/0.15)] sm:h-20 sm:pl-8"
        : "h-14 max-w-[34rem] border-dashed border-foreground/30 bg-transparent px-6 hover:border-foreground/50",
      errorFor(field) &&
        "border-red-600/70 shadow-none focus-within:ring-red-500/20 dark:border-red-400/70",
    );
  };

  const label = (field: Field) =>
    cn(
      "shrink-0 cursor-text text-foreground/70 dark:text-muted-foreground",
      active === field ? "text-xs font-medium" : "w-20 text-sm",
    );

  const input = (field: Field) =>
    cn(
      "auth-input w-full min-w-0 bg-transparent text-foreground caret-accent outline-none placeholder:text-foreground/55 dark:placeholder:text-muted-foreground",
      active === field
        ? "text-lg sm:text-xl"
        : "text-[15px] text-foreground/80",
    );

  // Each pill's message sits directly under it
  const message = (field: Field) => {
    const text = errorFor(field);
    if (!text || signedIn) return null;
    return (
      <motion.p
        layout="position"
        transition={transition}
        id={`${field}-error`}
        role="alert"
        className="-mt-1 flex w-full max-w-[34rem] items-start gap-2 px-6 text-left text-sm text-red-700 dark:text-red-400"
      >
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        {text}
      </motion.p>
    );
  };

  const disc = (
    <motion.button
      layoutId="auth-go"
      transition={transition}
      type="submit"
      disabled={isSubmitting || signedIn}
      aria-label={active === "email" ? "Continue to password" : "Sign in"}
      className="relative z-10 grid size-14 shrink-0 place-items-center rounded-full bg-accent text-[hsl(var(--on-accent))] transition-[filter,transform] duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-95 disabled:cursor-default sm:size-16"
    >
      {isSubmitting || signedIn ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <ArrowRight className="size-5" />
      )}
    </motion.button>
  );

  return (
    <div className="flex w-full flex-col items-center">
      <div className="auth-rise" style={{ animationDelay: "60ms" }}>
        <AuthPortrait />
      </div>

      <h1
        className="auth-rise mt-8 text-balance pb-1 font-display text-[clamp(3rem,10vw,6rem)] font-semibold leading-[0.92] tracking-[-0.04em] text-foreground"
        style={{ animationDelay: "120ms" }}
      >
        Welcome back
      </h1>
      <p
        className="auth-rise mt-4 text-[15px] text-foreground/70 dark:text-muted-foreground sm:text-base"
        style={{ animationDelay: "180ms" }}
      >
        Sign in to manage projects, posts and skills.
      </p>

      {/* The entrance and the error shake both use transform, so they sit on separate elements */}
      <div
        className="auth-rise mt-12 w-full sm:mt-14"
        style={{ animationDelay: "240ms" }}
      >
        <motion.form
          animate={shake}
          onSubmit={onSubmit}
          // A submit before hydration must never put the password in the URL
          method="post"
          noValidate
          className="flex w-full flex-col items-center gap-3"
        >
          <motion.div
            layout
            transition={transition}
            style={{ borderRadius: 999 }}
            className={pill("email")}
            onFocus={() => setActive("email")}
            onClick={() => go("email")}
          >
            <motion.div
              layout="position"
              transition={transition}
              className={cn(
                "flex min-w-0 flex-1",
                active === "email" ? "flex-col gap-0.5" : "items-center",
              )}
            >
              <label htmlFor="email" className={label("email")}>
                Email
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoFocus
                spellCheck={false}
                placeholder="you@example.com"
                className={input("email")}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
            </motion.div>
            {active === "email" && disc}
          </motion.div>
          {message("email")}

          <motion.div
            layout
            transition={transition}
            style={{ borderRadius: 999 }}
            className={pill("password")}
            onFocus={() => setActive("password")}
            onClick={() => go("password")}
          >
            <motion.div
              layout="position"
              transition={transition}
              className={cn(
                "flex min-w-0 flex-1",
                active === "password" ? "flex-col gap-0.5" : "items-center",
              )}
            >
              <label htmlFor="password" className={label("password")}>
                Password
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder={
                  active === "password" ? "Your password" : undefined
                }
                className={input("password")}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errorFor("password") ? "password-error" : undefined
                }
                {...register("password")}
              />
            </motion.div>
            {active === "password" && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPassword((v) => !v);
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="mr-1 grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? (
                    <EyeOff className="size-[18px]" />
                  ) : (
                    <Eye className="size-[18px]" />
                  )}
                </button>
                {disc}
              </>
            )}

            {/* Success: the disc floods its pill before the dashboard loads */}
            {signedIn && (
              <motion.span
                aria-hidden="true"
                initial={
                  reduceMotion
                    ? false
                    : { clipPath: "circle(32px at calc(100% - 2.5rem) 50%)" }
                }
                animate={{
                  clipPath: "circle(1000px at calc(100% - 2.5rem) 50%)",
                }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 z-20 flex items-center justify-center gap-2 bg-accent text-base font-semibold text-[hsl(var(--on-accent))]"
              >
                <Check className="size-5" />
                Signed in
              </motion.span>
            )}
          </motion.div>

          {message("password")}
          <p aria-live="polite" className="sr-only">
            {signedIn && "Signed in. Opening the dashboard."}
          </p>
        </motion.form>
      </div>

      <p
        className="auth-rise mt-8 max-w-[34ch] text-[13px] leading-relaxed text-foreground/70 dark:text-muted-foreground"
        style={{ animationDelay: "300ms" }}
      >
        Only admins can sign in. Accounts are added from the Users page.
      </p>
    </div>
  );
}
