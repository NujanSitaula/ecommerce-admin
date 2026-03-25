"use client";

import { useEffect, useState, useTransition } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Product, Media } from "@/lib/types";
import { MediaSelector } from "@/components/media/media-selector";

const schema = z.object({
  seo_title: z.string().max(255).optional().or(z.literal("")),
  seo_description: z.string().optional().or(z.literal("")),
  seo_keywords: z.string().max(1000).optional().or(z.literal("")),
  canonical_url: z.string().url().optional().or(z.literal("")),
  meta_robots: z.string().max(255).optional().or(z.literal("")),
  og_title: z.string().max(255).optional().or(z.literal("")),
  og_description: z.string().optional().or(z.literal("")),
  og_image_url: z.string().url().optional().or(z.literal("")),
  og_type: z.string().max(50).optional().or(z.literal("")),
  og_url_override: z.string().url().optional().or(z.literal("")),
  twitter_title: z.string().max(255).optional().or(z.literal("")),
  twitter_description: z.string().optional().or(z.literal("")),
  twitter_image_url: z.string().url().optional().or(z.literal("")),
  twitter_card_type: z.string().max(50).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface ProductSeoSidebarProps {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (product: Product) => void;
}

type ProductSeoPayload = {
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  canonical_url?: string | null;
  meta_robots?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;
  og_type?: string | null;
  og_url_override?: string | null;
  twitter_title?: string | null;
  twitter_description?: string | null;
  twitter_image_url?: string | null;
  twitter_card_type?: string | null;
};

type ProductSeoResponse = {
  product: Product;
  seo: Product["seo"];
};

export function ProductSeoSidebar({
  productId,
  open,
  onOpenChange,
  onUpdated,
}: ProductSeoSidebarProps) {
  const [isPending, startTransition] = useTransition();
  const [product, setProduct] = useState<Product | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState<{
    field: "og_image_url" | "twitter_image_url" | null;
  }>({ field: null });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  useEffect(() => {
    if (!open || !productId) return;

    setInitialLoaded(false);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/products/${productId}/seo`, {
          method: "GET",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err as { message?: string }).message ||
              "Unable to load SEO data",
          );
        }
        const { product: p, seo } = (await res.json()) as ProductSeoResponse;
        setProduct(p);

        const values: FormValues = {
          seo_title: seo?.seo_title ?? "",
          seo_description: seo?.seo_description ?? "",
          seo_keywords: seo?.seo_keywords ?? "",
          canonical_url: seo?.canonical_url ?? "",
          meta_robots: seo?.meta_robots ?? "",
          og_title: seo?.og_title ?? "",
          og_description: seo?.og_description ?? "",
          og_image_url: seo?.og_image_url ?? "",
          og_type: seo?.og_type ?? "",
          og_url_override: seo?.og_url_override ?? "",
          twitter_title: seo?.twitter_title ?? "",
          twitter_description: seo?.twitter_description ?? "",
          twitter_image_url: seo?.twitter_image_url ?? "",
          twitter_card_type: seo?.twitter_card_type ?? "",
        };

        form.reset(values, { keepDefaultValues: false });
        setInitialLoaded(true);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to load SEO data",
        );
      }
    });
  }, [open, productId, form]);

  const onSubmit = (values: FormValues) => {
    if (!productId) return;

    const payload: ProductSeoPayload = {
      ...values,
    };

    // Normalize empty strings to undefined so backend treats them as null / cleared
    Object.keys(payload).forEach((key) => {
      const k = key as keyof ProductSeoPayload;
      if (payload[k] === "") {
        payload[k] = undefined as any;
      }
    });

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/products/${productId}/seo`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err as { message?: string }).message ||
              "Unable to save SEO settings",
          );
        }
        const { product: updated } = (await res.json()) as ProductSeoResponse;
        toast.success("SEO settings updated");
        if (onUpdated) {
          onUpdated(updated);
        }
        onOpenChange(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to save SEO settings",
        );
      }
    });
  };

  const status = product?.seo?.seo_status ?? null;
  const score = product?.seo?.seo_score ?? null;

  const statusLabel =
    status === "green"
      ? "Good"
      : status === "yellow"
      ? "Needs improvement"
      : status === "red"
      ? "Poor"
      : "Not evaluated";

  const statusColor =
    status === "green"
      ? "bg-emerald-500"
      : status === "yellow"
      ? "bg-amber-500"
      : status === "red"
      ? "bg-red-500"
      : "bg-slate-300";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Manage SEO</SheetTitle>
          <SheetDescription>
            Configure search and social metadata for this product. If left
            empty, basic metadata will be generated automatically.
          </SheetDescription>
        </SheetHeader>

        {product && (
          <div className="px-4 pb-2 space-y-2">
            <div className="text-sm font-medium">{product.name}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${statusColor}`}
                />
                {statusLabel}
              </span>
              {typeof score === "number" && (
                <span className="text-[0.7rem]">SEO score: {score}%</span>
              )}
            </div>
          </div>
        )}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 px-4 py-2 overflow-y-auto"
        >
          {!initialLoaded && productId && (
            <div className="text-sm text-muted-foreground">Loading…</div>
          )}

          {initialLoaded && (
            <>
              <div className="space-y-2">
                <Label htmlFor="seo_title">SEO Title</Label>
                <Input id="seo_title" {...form.register("seo_title")} />
                <p className="text-[0.7rem] text-muted-foreground">
                  Recommended 30–65 characters. Defaults to product name or meta
                  title.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_description">Meta Description</Label>
                <Input
                  id="seo_description"
                  {...form.register("seo_description")}
                />
                <p className="text-[0.7rem] text-muted-foreground">
                  Recommended 70–170 characters. Defaults to meta description or
                  product description.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_keywords">Keywords</Label>
                <Input id="seo_keywords" {...form.register("seo_keywords")} />
                <p className="text-[0.7rem] text-muted-foreground">
                  Comma-separated keywords. Defaults to terms from name,
                  category, and tags.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canonical_url">Canonical URL</Label>
                <Input
                  id="canonical_url"
                  placeholder="https://example.com/products/slug"
                  {...form.register("canonical_url")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_robots">Robots</Label>
                <Input
                  id="meta_robots"
                  placeholder="index,follow"
                  {...form.register("meta_robots")}
                />
              </div>

              <div className="pt-2 space-y-3 border-t">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  Open Graph (Facebook, LinkedIn, etc.)
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_title">OG Title</Label>
                  <Input id="og_title" {...form.register("og_title")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_description">OG Description</Label>
                  <Input
                    id="og_description"
                    {...form.register("og_description")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_image_url">OG Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="og_image_url"
                    placeholder="Select image from media library"
                    {...form.register("og_image_url")}
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setMediaSelectorOpen({ field: "og_image_url" })
                    }
                  >
                    Choose
                  </Button>
                </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_type">OG Type</Label>
                  <Input
                    id="og_type"
                    placeholder="product"
                    {...form.register("og_type")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_url_override">OG URL Override</Label>
                  <Input
                    id="og_url_override"
                    placeholder="https://example.com/products/slug"
                    {...form.register("og_url_override")}
                  />
                </div>
              </div>

              <div className="pt-2 space-y-3 border-t">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  Twitter
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter_title">Twitter Title</Label>
                  <Input
                    id="twitter_title"
                    {...form.register("twitter_title")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter_description">
                    Twitter Description
                  </Label>
                  <Input
                    id="twitter_description"
                    {...form.register("twitter_description")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter_image_url">Twitter Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="twitter_image_url"
                    placeholder="Select image from media library"
                    {...form.register("twitter_image_url")}
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setMediaSelectorOpen({ field: "twitter_image_url" })
                    }
                  >
                    Choose
                  </Button>
                </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter_card_type">Twitter Card Type</Label>
                  <Input
                    id="twitter_card_type"
                    placeholder="summary_large_image"
                    {...form.register("twitter_card_type")}
                  />
                </div>
              </div>
            </>
          )}

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !productId}>
              {isPending ? "Saving..." : "Save SEO"}
            </Button>
          </SheetFooter>
        </form>

        <MediaSelector
          open={mediaSelectorOpen.field !== null}
          onOpenChange={(open) => {
            if (!open) {
              setMediaSelectorOpen({ field: null });
            }
          }}
          selectionMode="single"
          filterType="image"
          onSelect={(media: Media) => {
            if (!mediaSelectorOpen.field) return;
            const url = media.url || media.thumbnail_url || media.path;
            if (!url) return;
            form.setValue(mediaSelectorOpen.field, url, {
              shouldDirty: true,
              shouldTouch: true,
            });
            setMediaSelectorOpen({ field: null });
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

