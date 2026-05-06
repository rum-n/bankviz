import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { checkRateLimit, resetRateLimit } from "./rate-limit";

function getIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const ip = getIP(request);
        const { allowed } = checkRateLimit(ip);
        if (!allowed) return null;

        if (
          credentials?.username === process.env.AUTH_USERNAME &&
          credentials?.password === process.env.AUTH_PASSWORD
        ) {
          resetRateLimit(ip);
          return { id: "1", name: process.env.AUTH_USERNAME as string };
        }
        return null;
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
});
