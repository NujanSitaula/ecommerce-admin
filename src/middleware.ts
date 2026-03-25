import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/config";

const PUBLIC_PATHS = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // If accessing protected route without token, redirect to login
  if (!isPublic && !token) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  // Don't redirect authenticated users away from login - let the layout handle it
  // This prevents redirect loops if the token is invalid
  // The protected layout will handle redirecting authenticated users

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

