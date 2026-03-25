import { SETTINGS_PATH } from "./config";
import { apiFetch } from "./api-client";
import type { StoreSettings } from "./types";

export const getStoreSettings = async () =>
  apiFetch<StoreSettings>({
    path: SETTINGS_PATH,
    authenticated: true,
  });

export const updateStoreSettings = async (payload: StoreSettings) =>
  apiFetch<StoreSettings>({
    path: SETTINGS_PATH,
    method: "PUT",
    body: payload,
    authenticated: true,
  });

