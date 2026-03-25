import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { headers } from "next/headers";
import { AUTH_COOKIE_NAME, API_BASE_URL, ME_PATH } from "@/lib/config";
import type { SessionUser } from "@/lib/types";

async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    // Read cookie from headers (Next.js 16 requires await)
    const headersList = await headers();
    const cookieHeader = headersList.get('cookie');
    
    let token: string | undefined;
    if (cookieHeader) {
      const parsedCookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          acc[name] = decodeURIComponent(value);
        }
        return acc;
      }, {} as Record<string, string>);
      token = parsedCookies[AUTH_COOKIE_NAME];
    }

    if (!token) {
      return null;
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
      return null;
    }

    const user = (await response.json()) as SessionUser;
    return user;
  } catch (error) {
    return null;
  }
}

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
      redirect("/login");
    }

    return <AppShell user={user}>{children}</AppShell>;
  } catch (error) {
    console.error('Layout error:', error);
    redirect("/login");
  }
}

