"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

// HDR: LOGIN USERS WITH CREDENTIALS
const handleLogin = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: true, message: "Invalid email or password" };
    }

    throw error;
  }

  // redirect must be called OUTSIDE try/catch — it throws NEXT_REDIRECT
  redirect("/admin");
};

export { handleLogin };
