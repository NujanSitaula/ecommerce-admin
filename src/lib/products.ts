import { PRODUCTS_PATH } from "./config";
import { apiFetch } from "./api-client";
import type { Paginated, Product } from "./types";

export const listProducts = async () =>
  apiFetch<Paginated<Product>>({
    path: PRODUCTS_PATH,
    authenticated: true,
  });

export const getProduct = async (id: string) =>
  apiFetch<Product>({
    path: `${PRODUCTS_PATH}/${id}`,
    authenticated: true,
  });

export const createProduct = async (payload: Partial<Product>) =>
  apiFetch<Product>({
    path: PRODUCTS_PATH,
    method: "POST",
    body: payload,
    authenticated: true,
  });

export const updateProduct = async (id: string, payload: Partial<Product>) =>
  apiFetch<Product>({
    path: `${PRODUCTS_PATH}/${id}`,
    method: "PUT",
    body: payload,
    authenticated: true,
  });

export const deleteProduct = async (id: string) =>
  apiFetch<{ success: boolean }>({
    path: `${PRODUCTS_PATH}/${id}`,
    method: "DELETE",
    authenticated: true,
  });

