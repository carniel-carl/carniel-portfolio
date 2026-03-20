"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

// HDR: LOGIN USERS WITH CREDENTIALS
const handleLogin = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  try {
    // redirectTo lets AuthJS set the session cookie AND redirect atomically
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: true, message: "Invalid email or password" };
    }

    // Re-throw NEXT_REDIRECT (thrown by AuthJS on success) and other errors
    throw error;
  }
};

export { handleLogin };
