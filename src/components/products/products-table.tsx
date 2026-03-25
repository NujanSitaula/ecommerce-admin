"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { ProductImagePreview } from "@/components/products/product-image-preview";
import { AlertTriangle, Clock, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react";
import { ProductSeoSidebar } from "@/components/products/product-seo-sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function SeoStatusPill({ product }: { product: Product }) {
  const status = product.seo?.seo_status ?? null;
  const score = product.seo?.seo_score ?? null;

  const label =
    status === "green"
      ? "Good"
      : status === "yellow"
      ? "Needs improvement"
      : status === "red"
      ? "Poor"
      : "Not set";

  const colorClass =
    status === "green"
      ? "bg-emerald-500"
      : status === "yellow"
      ? "bg-amber-500"
      : status === "red"
      ? "bg-red-500"
      : "bg-slate-300";

  return (
    <div className="flex items-center justify-start gap-2 text-xs">
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium text-white ${colorClass}`}
      >
        {label}
      </span>
      {typeof score === "number" && (
        <span className="text-[0.7rem] text-muted-foreground">
          {score}%
        </span>
      )}
    </div>
  );
}

export function ProductsTable({ initial }: { initial: Product[] }) {
  const [products, setProducts] = React.useState<Product[]>(initial);
  const [seoProductId, setSeoProductId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const handleSeoUpdated = (updated: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
    );
  };

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>SEO</TableHead>
              <TableHead>Inventory Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Production</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No products yet.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const inventoryType = product.inventory_type || "in_stock";
                const stock = product.quantity ?? product.stock ?? 0;
                const lowStockThreshold = product.low_stock_threshold ?? 5;
                const isLowStock =
                  product.track_inventory && stock <= lowStockThreshold;
                const isMadeToOrder =
                  inventoryType === "made_to_order" ||
                  inventoryType === "both";

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <ProductImagePreview
                        thumbnailUrl={product.thumbnail_url}
                        originalUrl={product.original_url}
                        gallery={product.gallery}
                        alt={product.name}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="capitalize">
                      {product.status ?? "—"}
                    </TableCell>
                    <TableCell>
                      <SeoStatusPill product={product} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          inventoryType === "made_to_order"
                            ? "secondary"
                            : inventoryType === "both"
                            ? "outline"
                            : "default"
                        }
                      >
                        {inventoryType === "made_to_order"
                          ? "Made to Order"
                          : inventoryType === "both"
                          ? "Both"
                          : "In Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.currency ?? ""} {product.price ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {product.track_inventory ? (
                          <>
                            <span
                              className={
                                isLowStock ? "text-red-500 font-medium" : ""
                              }
                            >
                              {stock}
                            </span>
                            {isLowStock && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isMadeToOrder && product.production_time_days ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {product.production_time_days} days
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="flex items-center justify-end">
                      <AlertDialog
                        open={deletingId === product.id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setDeletingId(null);
                            setIsDeleting(false);
                            setDeleteError(null);
                          }
                        }}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Open product actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setSeoProductId(product.id)}
                            >
                              <Search className="h-4 w-4" />
                              Manage SEO
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/products/${product.id}`}>
                                <Pencil className="h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => {
                                setDeleteError(null);
                                setDeletingId(product.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete product?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will perform a soft delete so the product
                              is no longer visible in your catalog, but the
                              record is preserved to prevent permanent data
                              loss.
                              {deleteError && (
                                <span className="mt-2 block text-red-500">
                                  {deleteError}
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              disabled={isDeleting}
                            >
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                try {
                                  setIsDeleting(true);
                                  setDeleteError(null);
                                  const response = await fetch(
                                    `/api/admin/products/${product.id}`,
                                    {
                                      method: "DELETE",
                                    },
                                  );
                                  if (!response.ok) {
                                    const data = await response
                                      .json()
                                      .catch(() => ({}));
                                    throw new Error(
                                      (data as any).message ||
                                        "Unable to delete product. Please try again.",
                                    );
                                  }
                                  setProducts((prev) =>
                                    prev.filter((p) => p.id !== product.id),
                                  );
                                  setDeletingId(null);
                                  setIsDeleting(false);
                                } catch (error) {
                                  setIsDeleting(false);
                                  setDeleteError(
                                    error instanceof Error
                                      ? error.message
                                      : "Unable to delete product. Please try again.",
                                  );
                                }
                              }}
                              disabled={isDeleting}
                            >
                              {isDeleting ? "Deleting..." : "Confirm delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ProductSeoSidebar
        productId={seoProductId}
        open={Boolean(seoProductId)}
        onOpenChange={(open) => {
          if (!open) {
            setSeoProductId(null);
          }
        }}
        onUpdated={handleSeoUpdated}
      />
    </>
  );
}

