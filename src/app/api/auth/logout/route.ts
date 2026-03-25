import { NextResponse } from "next/server";
import { clearAuthCookie, getAuthCookie, performLogout } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/config";

export async function POST() {
  const token = getAuthCookie();
  await performLogout(token);

  const response = NextResponse.json({ success: true });
  clearAuthCookie(response);
  response.cookies.set({
    name: `${AUTH_COOKIE_NAME}_refresh`,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}

