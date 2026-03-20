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
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { message: "Login successfully", error: false };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }

    return {
      message: "Something went wrong",
      error: true,
    };
  }
};

export { handleLogin };
