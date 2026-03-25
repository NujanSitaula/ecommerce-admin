import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/config";

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  const allCookies = request.cookies.getAll();
  
  return NextResponse.json({
    authCookie: cookie?.value || null,
    allCookies: allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })),
    cookieHeader: request.headers.get('cookie')?.substring(0, 100) || null,
  });
}

