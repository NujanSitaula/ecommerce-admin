import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, API_BASE_URL, ME_PATH } from "@/lib/config";
import type { SessionUser } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    // Read cookie from request
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Fetch user from backend
    const response = await fetch(`${API_BASE_URL}${ME_PATH}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = (await response.json()) as SessionUser;
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 },
    );
  }
}

