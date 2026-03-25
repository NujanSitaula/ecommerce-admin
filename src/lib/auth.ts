import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  API_BASE_URL,
  AUTH_COOKIE_NAME,
  LOGIN_PATH,
  LOGOUT_PATH,
  ME_PATH,
} from "./config";
import { ApiError } from "./api-client";
import type { LoginResponse, SessionUser } from "./types";

const secureCookie = process.env.NODE_ENV === "production";

export const getAuthCookie = () => {
  try {
    // Try using cookies() first (standard Next.js 16 way)
    try {
      const cookieStore = cookies();
      if (cookieStore && typeof (cookieStore as any).get === 'function') {
        return (cookieStore as any).get(AUTH_COOKIE_NAME)?.value;
      }
    } catch {
      // Fall through to header parsing
    }
    
    // Fallback: parse from Cookie header
    const headersList = headers();
    const cookieHeader = headersList.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          acc[name] = decodeURIComponent(value);
        }
        return acc;
      }, {} as Record<string, string>);
      return cookies[AUTH_COOKIE_NAME];
    }
    
    return undefined;
  } catch (error) {
    return undefined;
  }
};

export const setAuthCookie = (response: NextResponse, token: string) => {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie,
    path: "/",
  });
};

export const clearAuthCookie = (response: NextResponse) => {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie,
    path: "/",
    maxAge: 0,
  });
};

export async function performLogin(body: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}${LOGIN_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const parsed = await response.json().catch(() => ({}));
    throw new ApiError(
      (parsed as { message?: string }).message ??
        "Invalid credentials",
      response.status,
      parsed,
    );
  }

  const payload = (await response.json()) as LoginResponse;
  return payload;
}

export async function performLogout(token?: string) {
  if (!token) return;
  try {
    await fetch(`${API_BASE_URL}${LOGOUT_PATH}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch {
    // ignore upstream logout failures; cookie will be cleared locally
  }
}

export async function fetchCurrentUser(token?: string): Promise<SessionUser | null> {
  const accessToken = token ?? getAuthCookie();
  if (!accessToken) return null;

  const response = await fetch(`${API_BASE_URL}${ME_PATH}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as SessionUser;
  return data;
}

