"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Paginated, Product } from "@/lib/types";
import { ProductsTable } from "@/components/products/products-table";
import * as React from "react";

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/admin/products", {
          cache: "no-store",
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            (data as any).message || "Failed to load products.",
          );
        }
        const { data = [] } = (await response.json()) as Paginated<Product>;
        if (!cancelled) {
          setProducts(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load products.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage catalog items, SEO, and availability.
          </p>
        </div>
        <Button asChild>
          <Link href="/products/new">Add product</Link>
        </Button>
      </div>
      {loading ? (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Loading products...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <ProductsTable initial={products} />
      )}
    </div>
  );
}

