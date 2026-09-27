import AuthShowcase from "@/components/admin/auth/AuthShowcase";
import LoginForm from "@/components/admin/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-[100dvh] bg-background lg:h-[100dvh] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <AuthShowcase />
      <LoginForm />
    </main>
  );
}
