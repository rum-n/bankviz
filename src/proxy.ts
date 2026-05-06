import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
const secureCookie = authUrl.startsWith("https://");

export async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie,
  });

  const isLoggedIn = !!token;
  const isLoginPage = req.nextUrl.pathname.startsWith("/login");

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: ["/((?!api/auth|api/health|_next/static|_next/image|favicon.ico).*)"],
};
