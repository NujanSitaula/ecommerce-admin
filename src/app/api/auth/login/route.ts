import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/config";
import { performLogin, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { email, password } = body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required" },
      { status: 400 },
    );
  }

  try {
    const loginResponse = await performLogin({ email, password });

    const response = NextResponse.json({
      user: loginResponse.user,
    });

    setAuthCookie(response, loginResponse.token);

    if (loginResponse.refreshToken) {
      response.cookies.set({
        name: `${AUTH_COOKIE_NAME}_refresh`,
        value: loginResponse.refreshToken,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to login. Check credentials and retry.",
      },
      { status: 401 },
    );
  }
}

