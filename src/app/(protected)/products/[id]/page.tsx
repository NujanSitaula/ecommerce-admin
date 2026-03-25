import { notFound } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import type { Product } from "@/lib/types";
import { API_BASE_URL } from "@/lib/config";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/config";

const fetchProduct = async (id: string): Promise<Product | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    
    if (!token) {
      console.error("No auth token found");
      return null;
    }

    const url = `${API_BASE_URL}/api/admin/products/${id}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch product:", response.status, response.statusText);
      return null;
    }

    const responseData = await response.json();
    
    // Handle wrapped response (if API returns {data: {...}})
    const product = responseData.data || responseData;
    return product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) {
    notFound();
  }
  return <ProductForm product={product} />;
}

