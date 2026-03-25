"use client";

import { useState, useEffect } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ImageUpload, type ImageFile } from "./image-upload";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { VariantManager } from "./variant-manager";
import { PersonalizationOptions } from "./personalization-options";
import { MaterialsManager } from "./materials-manager";
import type { Product, ProductVariant, ProductPersonalizationOption, ProductMaterial } from "@/lib/types";
import { API_BASE_URL } from "@/lib/config";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().optional(),
  sku: z.string().optional(),
  category_id: z.coerce.number().optional(),
  description: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  price: z.coerce.number().nonnegative("Price must be non-negative"),
  sale_price: z.coerce.number().nonnegative("Sale price must be non-negative").optional(),
  currency: z.string().min(1).default("USD"),
  quantity: z.coerce.number().nonnegative().optional(),
  unit: z.string().optional(),
  weight: z.coerce.number().nonnegative().optional(),
  length: z.coerce.number().nonnegative().optional(),
  width: z.coerce.number().nonnegative().optional(),
  height: z.coerce.number().nonnegative().optional(),
  shipping_class: z.string().optional(),
  type: z.string().optional(),
  status: z.enum(["draft", "active"]).default("draft"),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  // Inventory settings
  inventory_type: z.enum(["in_stock", "made_to_order", "both"]).optional(),
  production_time_days: z.coerce.number().nonnegative().optional(),
  min_quantity: z.coerce.number().positive().optional(),
  max_quantity: z.coerce.number().positive().optional(),
  low_stock_threshold: z.coerce.number().nonnegative().optional(),
  track_inventory: z.boolean().default(true),
  cost_of_goods: z.coerce.number().nonnegative().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Category {
  id: number;
  name: string;
  slug: string;
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);
  const [personalizationOptions, setPersonalizationOptions] = useState<ProductPersonalizationOption[]>(
    product?.personalization_options || []
  );
  const [materials, setMaterials] = useState<ProductMaterial[]>(product?.materials || []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Fetch categories via Next.js API route to avoid CORS
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (data.data && Array.isArray(data.data)) {
          setCategories(data.data);
        }
      })
      .catch(() => {});

    // Load existing images
    if (product) {
      const existingImages: ImageFile[] = [];
      
      // Add gallery images
      if (product.gallery && product.gallery.length > 0) {
        product.gallery.forEach((url, index) => {
          // Check if this image matches the thumbnail_url (featured image)
          const isFeatured = product.thumbnail_url === url || 
            (index === 0 && !product.thumbnail_url);
          
          existingImages.push({
            id: `existing-${index}`,
            url,
            thumbnail_url: url, // Use the image's own URL as thumbnail, not the product's thumbnail_url
            original_name: `Image ${index + 1}`,
            path: url,
            isFeatured,
          });
        });
      }
      
      // If no gallery but has thumbnail/original, add them
      if (existingImages.length === 0 && (product.thumbnail_url || product.original_url)) {
        const imageUrl = product.original_url || product.thumbnail_url || '';
        existingImages.push({
          id: 'existing-0',
          url: imageUrl,
          thumbnail_url: product.thumbnail_url || imageUrl,
          original_name: 'Product Image',
          path: imageUrl,
          isFeatured: true,
        });
      }
      
      if (existingImages.length > 0) {
        setImages(existingImages);
      }
    }
  }, [product]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      sku: product?.sku ?? "",
      category_id: product?.category_id,
      description: product?.description ?? "",
      meta_title: product?.meta_title ?? "",
      meta_description: product?.meta_description ?? "",
      price: product?.price ?? 0,
      sale_price: product?.sale_price,
      currency: product?.currency ?? "USD",
      quantity: product?.quantity ?? product?.stock ?? 0,
      unit: product?.unit ?? "",
      weight: product?.weight,
      length: product?.length,
      width: product?.width,
      height: product?.height,
      shipping_class: product?.shipping_class ?? "",
      type: product?.type ?? "",
      status: (product?.status as "draft" | "active") ?? "draft",
      featured: product?.featured ?? false,
      tags: product?.tags ?? [],
      // Inventory settings
      inventory_type: (product?.inventory_type as "in_stock" | "made_to_order" | "both") ?? "in_stock",
      production_time_days: product?.production_time_days,
      min_quantity: product?.min_quantity,
      max_quantity: product?.max_quantity,
      low_stock_threshold: product?.low_stock_threshold ?? 5,
      track_inventory: product?.track_inventory ?? true,
      cost_of_goods: product?.cost_of_goods,
    },
  });

  // Update form when product changes (for edit mode)
  useEffect(() => {
    if (product) {
      const formData = {
        name: product.name ?? "",
        slug: product.slug ?? "",
        sku: product.sku ?? "",
        category_id: product.category_id,
        description: product.description ?? "",
        meta_title: product.meta_title ?? "",
        meta_description: product.meta_description ?? "",
        price: product.price ?? 0,
        sale_price: product.sale_price,
        currency: product.currency ?? "USD",
        quantity: product.quantity ?? product.stock ?? 0,
        unit: product.unit ?? "",
        weight: product.weight,
        length: product.length,
        width: product.width,
        height: product.height,
        shipping_class: product.shipping_class ?? "",
        type: product.type ?? "",
        status: (product.status as "draft" | "active") ?? "draft",
        featured: product.featured ?? false,
        tags: product.tags ?? [],
        // Inventory settings
        inventory_type: (product.inventory_type as "in_stock" | "made_to_order" | "both") ?? "in_stock",
        production_time_days: product.production_time_days,
        min_quantity: product.min_quantity,
        max_quantity: product.max_quantity,
        low_stock_threshold: product.low_stock_threshold ?? 5,
        track_inventory: product.track_inventory ?? true,
        cost_of_goods: product.cost_of_goods,
      };
      
      // Use reset with keepDefaultValues: false to ensure all fields update
      form.reset(formData, { keepDefaultValues: false });
      
      // Update variants
      if (product.variants) {
        setVariants(product.variants);
      }
      
      // Update personalization options
      if (product.personalization_options) {
        setPersonalizationOptions(product.personalization_options);
      }
      
      // Update materials
      if (product.materials) {
        setMaterials(product.materials);
      }
    }
  }, [product, form]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        // Auto-generate slug if not provided
        if (!values.slug && values.name) {
          values.slug = generateSlug(values.name);
        }

        // Prepare gallery URLs
        const gallery = images.map((img) => img.url);
        
        // Find featured image, or use first image as fallback
        const featuredImage = images.find((img) => img.isFeatured) || images[0];
        const thumbnail_url = featuredImage?.thumbnail_url || featuredImage?.url || null;
        const original_url = featuredImage?.url || null;

        // Format materials for API
        const materialsPayload = materials.length > 0
          ? materials
              .filter((m) => m.material_id > 0 && m.quantity_required > 0)
              .map((m) => ({
                material_id: m.material_id,
                quantity_required: m.quantity_required,
              }))
          : undefined;

        const payload = {
          ...values,
          gallery,
          thumbnail_url,
          original_url,
          variants: variants.length > 0 ? variants : undefined,
          personalization_options: personalizationOptions.length > 0 ? personalizationOptions : undefined,
          materials: materialsPayload,
        };

        const url = product
          ? `/api/admin/products/${product.id}`
          : "/api/admin/products";
        const method = product ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(
            (error as { message?: string }).message || "Unable to save product"
          );
        }

        toast.success("Product saved");
        router.replace("/products");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Save failed"
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {product ? "Edit product" : "New product"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {product
            ? "Update product details"
            : "Add a new product to your catalog."}
        </p>
      </div>

      <form key={product?.id || 'new'} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  onChange={(e) => {
                    form.setValue("name", e.target.value);
                    if (!form.getValues("slug")) {
                      form.setValue("slug", generateSlug(e.target.value));
                    }
                  }}
                />
                {form.formState.errors.name?.message && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" {...form.register("slug")} />
                {form.formState.errors.slug?.message && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.slug.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" {...form.register("sku")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                {mounted ? (
                  <Select
                    value={form.watch("category_id")?.toString() || "none"}
                    onValueChange={(value) =>
                      form.setValue("category_id", value === "none" ? undefined : parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="category_id"
                    placeholder="Select category"
                    disabled
                    value={form.watch("category_id") ? categories.find(c => c.id === form.watch("category_id"))?.name || "" : ""}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input id="type" {...form.register("type")} placeholder="e.g., bag, pashmina" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                {mounted ? (
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value) =>
                      form.setValue("status", value as "draft" | "active")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="status"
                    placeholder="Status"
                    disabled
                    value={form.watch("status") || "draft"}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <RichTextEditor
                content={form.watch("description") || ""}
                onChange={(content) => form.setValue("description", content)}
                placeholder="Enter product description..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={form.watch("featured")}
                onCheckedChange={(checked) => form.setValue("featured", checked)}
              />
              <Label htmlFor="featured">Featured Product</Label>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={10}
              productId={product?.id ? parseInt(product.id) : undefined}
            />
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Price <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...form.register("price", { valueAsNumber: true })}
                />
                {form.formState.errors.price?.message && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.price.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale_price">Sale Price</Label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  {...form.register("sale_price", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" {...form.register("currency")} maxLength={3} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inventory_type">Inventory Type</Label>
                {mounted ? (
                  <Select
                    value={form.watch("inventory_type") || "in_stock"}
                    onValueChange={(value: "in_stock" | "made_to_order" | "both") => {
                      form.setValue("inventory_type", value);
                    }}
                  >
                    <SelectTrigger id="inventory_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="made_to_order">Made to Order</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value="in_stock" disabled />
                )}
              </div>

              {(form.watch("inventory_type") === "made_to_order" || form.watch("inventory_type") === "both") && (
                <div className="space-y-2">
                  <Label htmlFor="production_time_days">Production Time (Days)</Label>
                  <Input
                    id="production_time_days"
                    type="number"
                    min="0"
                    {...form.register("production_time_days", { valueAsNumber: true })}
                    placeholder="e.g., 7"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="quantity">Stock Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  {...form.register("quantity", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input id="unit" {...form.register("unit")} placeholder="e.g., piece, kg" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_quantity">Min Order Quantity</Label>
                <Input
                  id="min_quantity"
                  type="number"
                  min="1"
                  {...form.register("min_quantity", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_quantity">Max Order Quantity</Label>
                <Input
                  id="max_quantity"
                  type="number"
                  min="1"
                  {...form.register("max_quantity", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  min="0"
                  {...form.register("low_stock_threshold", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_of_goods">Cost of Goods (COGS)</Label>
                <Input
                  id="cost_of_goods"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("cost_of_goods", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="track_inventory"
                checked={form.watch("track_inventory") ?? true}
                onCheckedChange={(checked) => form.setValue("track_inventory", checked)}
              />
              <Label htmlFor="track_inventory" className="cursor-pointer">
                Track inventory for this product
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Product Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <VariantManager variants={variants} onVariantsChange={setVariants} />
          </CardContent>
        </Card>

        {/* Shipping */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  {...form.register("weight", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping_class">Shipping Class</Label>
                <Input id="shipping_class" {...form.register("shipping_class")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length">Length (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.01"
                  {...form.register("length", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.01"
                  {...form.register("width", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.01"
                  {...form.register("height", { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input id="meta_title" {...form.register("meta_title")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta_description">Meta Description</Label>
              <Input id="meta_description" {...form.register("meta_description")} />
            </div>
          </CardContent>
        </Card>

        {/* Personalization Options */}
        <PersonalizationOptions
          options={personalizationOptions}
          onChange={setPersonalizationOptions}
        />

        {/* Materials */}
        <MaterialsManager
          materials={materials}
          onChange={setMaterials}
        />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
