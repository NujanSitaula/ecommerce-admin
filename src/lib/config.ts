export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "http://localhost:8000";

export const AUTH_COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME || "admin_session_token";

export const LOGIN_PATH =
  process.env.ADMIN_LOGIN_PATH || "/api/auth/login";

export const ME_PATH = process.env.ADMIN_ME_PATH || "/api/auth/me";

export const LOGOUT_PATH =
  process.env.ADMIN_LOGOUT_PATH || "/api/auth/logout";

export const PRODUCTS_PATH =
  process.env.ADMIN_PRODUCTS_PATH || "/api/admin/products";

export const SETTINGS_PATH =
  process.env.ADMIN_SETTINGS_PATH || "/api/admin/settings";

export const TAX_RATES_PATH =
  process.env.ADMIN_TAX_RATES_PATH || "/api/admin/tax-rates";

export const REQUEST_TIMEOUT_MS = Number(
  process.env.API_REQUEST_TIMEOUT_MS || 15000,
);

