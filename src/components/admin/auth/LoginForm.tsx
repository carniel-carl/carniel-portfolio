"use client";

import SVGIcon from "@/components/general/SVGIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleLogin } from "@/lib/actions/login";
import routes from "@/lib/routes";
import { LoginFormData, loginSchema } from "@/lib/schemas/login";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export default function LoginForm() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    const result = await handleLogin(data);
    if (result.error) {
      setFormError(result.message);
      return;
    }
    router.push(routes.admin.dashboard);
    router.refresh();
  };

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 sm:px-8 lg:min-h-0">
      {/* Small screens: the brand panel is hidden, so the mark and exit live here */}
      <div className="flex items-center justify-between pt-5 lg:hidden">
        <span className="grid size-10 place-items-center rounded-xl bg-foreground text-accent">
          <SVGIcon width="1.25rem" height="1.25rem" />
        </span>
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5 transition-transform duration-300 ease-expo group-hover:-translate-x-0.5" />
          Back to the site
        </Link>
      </div>

      <motion.div
        variants={container}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        className="mx-auto flex w-full max-w-[22rem] flex-1 flex-col justify-center py-16"
      >
        <motion.h1
          variants={item}
          className="pb-1 font-display text-[2.75rem] font-semibold leading-[0.95] tracking-[-0.04em] text-foreground [font-stretch:75%]"
        >
          Welcome back
        </motion.h1>
        <motion.p variants={item} className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Sign in with your admin email and password.
        </motion.p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-10 space-y-5">
          <motion.div variants={item} className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              className="bg-card shadow-none"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </motion.div>

          <motion.div variants={item} className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="bg-card shadow-none"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </motion.div>

          {formError && (
            <motion.p
              role="alert"
              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {formError}
            </motion.p>
          )}

          <motion.div variants={item} className="pt-2">
            <Button
              type="submit"
              className="group h-12 w-full rounded-full text-[15px] active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Signing in
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="transition-transform duration-300 ease-expo group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </motion.div>
        </form>

        <motion.p variants={item} className="mt-8 text-[13px] text-muted-foreground">
          Only admins can sign in. Accounts are added from the Users page.
        </motion.p>
      </motion.div>
    </div>
  );
}
