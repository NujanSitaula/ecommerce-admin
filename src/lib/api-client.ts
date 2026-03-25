import { REQUEST_TIMEOUT_MS, API_BASE_URL, AUTH_COOKIE_NAME } from "./config";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequestOptions extends RequestInit {
  path: string;
  method?: HttpMethod;
  authenticated?: boolean;
}

export class ApiError extends Error {
  status?: number;
  body?: unknown;

  constructor(message: string, status?: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const resolveBaseUrl = () => API_BASE_URL.replace(/\/$/, "");

const readAuthToken = (): string | undefined => {
  // Only read cookies in the browser so this module
  // stays safe to import in client components.
  if (typeof document === "undefined") {
    return undefined;
  }

  try {
    const cookieString = document.cookie || "";
    const cookies = cookieString.split(";").reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        acc[name] = decodeURIComponent(value);
      }
      return acc;
    }, {} as Record<string, string>);

    return cookies[AUTH_COOKIE_NAME];
  } catch {
    return undefined;
  }
};

export async function apiFetch<T>({
  path,
  method = "GET",
  authenticated = false,
  headers: initHeaders,
  body,
  ...rest
}: ApiRequestOptions): Promise<T> {
  const url = `${resolveBaseUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
  const token = authenticated ? readAuthToken() : undefined;

  const mergedHeaders: HeadersInit = {
    Accept: "application/json",
    ...(body && typeof body === "object" && !(body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...initHeaders,
  };

  if (token) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  const response = await fetch(url, {
    method,
    body:
      body && typeof body === "object" && !(body instanceof FormData)
        ? JSON.stringify(body)
        : body,
    headers: mergedHeaders,
    cache: "no-store",
    credentials: "include",
    signal: controller.signal,
    ...rest,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    let parsedBody: unknown;
    try {
      parsedBody = await response.json();
    } catch {
      // ignore parse failures
    }
    throw new ApiError(
      parsedBody && typeof parsedBody === "object" && "message" in (parsedBody as Record<string, unknown>)
        ? String((parsedBody as { message?: string }).message)
        : `Request failed with status ${response.status}`,
      response.status,
      parsedBody,
    );
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

