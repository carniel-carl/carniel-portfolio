"use client";

import SVGIcon from "@/components/general/SVGIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleLogin } from "@/lib/actions/login";
import routes from "@/lib/routes";
import { LoginFormData, loginSchema } from "@/lib/schemas/login";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

const LoginPage = () => {
  const router = useRouter();
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
    <main className="flex min-h-[100dvh] flex-col bg-background px-4">
      <div className="mx-auto flex w-full max-w-sm items-center pt-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5 transition-transform duration-300 ease-expo group-hover:-translate-x-0.5" />
          Back to the site
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center pb-24">
        <span className="mb-8 grid size-11 place-items-center rounded-xl bg-foreground text-accent">
          <SVGIcon width="1.4rem" height="1.4rem" />
        </span>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage projects, posts and everything else on the portfolio.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              className="h-11 bg-card"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="h-11 bg-card"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {formError && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {formError}
            </p>
          )}

          <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isSubmitting ? "Signing in" : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
};

export default LoginPage;
