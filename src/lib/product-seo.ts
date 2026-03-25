import { apiFetch } from "./api-client";
import { PRODUCTS_PATH } from "./config";
import type { Product } from "./types";

export interface ProductSeoPayload {
  // General SEO
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  canonical_url?: string | null;
  meta_robots?: string | null;
  // Open Graph
  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;
  og_type?: string | null;
  og_url_override?: string | null;
  // Twitter
  twitter_title?: string | null;
  twitter_description?: string | null;
  twitter_image_url?: string | null;
  twitter_card_type?: string | null;
}

type ProductSeoResponse = {
  product: Product;
  seo: Product["seo"];
};

export const getProductSeo = async (id: string) =>
  apiFetch<ProductSeoResponse>({
    path: `${PRODUCTS_PATH}/${id}/seo`,
    authenticated: true,
  });

export const updateProductSeo = async (id: string, payload: ProductSeoPayload) =>
  apiFetch<ProductSeoResponse>({
    path: `${PRODUCTS_PATH}/${id}/seo`,
    method: "PUT",
    body: payload,
    authenticated: true,
  });

