import AuthShell from "@/components/admin/auth/AuthShell";
import LoginForm from "@/components/admin/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
