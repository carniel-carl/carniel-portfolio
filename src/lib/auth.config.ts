import type { NextAuthConfig } from "next-auth";

// The half of the Auth.js config that only reads and shapes the JWT session.
// No providers, so no Prisma or bcrypt: the proxy imports this to check the
// admin cookie without bundling the database client into its function.
// lib/auth adds the Credentials provider for the full instance.
export const authConfig = {
  providers: [],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 hours of inactivity signs you out
    updateAge: 60 * 60, // re-issue the cookie at most once an hour while active
  },
  debug: process.env.NODE_ENV !== "production",
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
