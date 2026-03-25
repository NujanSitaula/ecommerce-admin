"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import type { AdminPost, BlogTag } from "@/lib/types";
import type { JSONContent } from "@tiptap/react";
import { BlockEditor } from "@/components/posts/block-editor";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().optional(),
  body: z.any(),
  featured_image: z.string().optional(),
  is_published: z.boolean().optional(),
  published_at: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  tag_ids: z.array(z.number()).optional(),
});

type FormValues = z.infer<typeof schema>;

interface PostFormProps {
  post?: AdminPost | null;
}

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: post?.title ?? "",
      slug: post?.slug ?? "",
      excerpt: post?.excerpt ?? "",
      body:
        (post?.body as JSONContent | undefined) ?? {
          type: "doc",
          content: [{ type: "paragraph", content: [] }],
        },
      featured_image: post?.featured_image ?? "",
      is_published: post?.is_published ?? false,
      published_at: post?.published_at ?? "",
      seo_title: post?.seo_title ?? "",
      seo_description: post?.seo_description ?? "",
      tag_ids: post?.tags?.map((t) => t.id) ?? [],
    },
  });

  useEffect(() => {
    const loadTags = async () => {
      try {
        const res = await fetch("/api/admin/tags");
        if (!res.ok) return;
        const data = await res.json();
        const list: BlogTag[] = Array.isArray(data) ? data : data.data ?? [];
        setTags(list);
      } catch {
        // ignore for now
      }
    };
    loadTags();
  }, []);

  const handleGenerateSlug = () => {
    const title = form.getValues("title") ?? "";
    if (!title.trim()) return;
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    form.setValue("slug", slug);
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        featured_image: values.featured_image || null,
        seo_title: values.seo_title || null,
        seo_description: values.seo_description || null,
        tag_ids: values.tag_ids ?? [],
      };

      const url = post ? `/api/admin/posts/${post.id}` : "/api/admin/posts";
      const method = post ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.message || "Failed to save post";
        throw new Error(msg);
      }

      toast.success(`Post ${post ? "updated" : "created"} successfully`);
      router.push("/posts");
    } catch (error) {
      console.error("Failed to save post:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save post"
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedTagIds = form.watch("tag_ids") ?? [];

  const isPublished = !!form.watch("is_published");
  const statusLabel = isPublished ? "Published" : "Draft";

  const toggleTag = (id: number) => {
    const current = new Set(selectedTagIds);
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    form.setValue("tag_ids", Array.from(current));
  };

  return (
    <form
      className="grid gap-6 lg:grid-cols-[2fr,1fr]"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="title" className="sr-only">
            Title
          </Label>
          <Input
            id="title"
            placeholder="Enter title here"
            className="border-0 border-b border-input rounded-none px-0 text-3xl font-semibold shadow-none focus-visible:ring-0"
            {...form.register("title")}
          />
          {form.formState.errors.title?.message && (
            <p className="text-xs text-destructive">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">Slug:</span>
          <span>{form.watch("slug") || "—"}</span>
          <button
            type="button"
            className="text-primary underline-offset-2 hover:underline"
            onClick={handleGenerateSlug}
          >
            Generate from title
          </button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            rows={3}
            {...form.register("excerpt")}
            placeholder="Short summary shown in lists and previews"
          />
        </div>
        <div className="space-y-2">
          <Label>
            Body <span className="text-destructive">*</span>
          </Label>
          <BlockEditor
            value={form.watch("body") as JSONContent | undefined}
            onChange={(val) =>
              form.setValue("body", val, { shouldDirty: true })
            }
          />
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border bg-card shadow-sm">
          <CardHeader className="border-b bg-muted px-3 py-2">
            <CardTitle className="text-sm font-medium">Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-3 py-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Status:</span>
              <span className="text-muted-foreground">{statusLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 text-xs">
                <Label htmlFor="is_published" className="font-medium">
                  Published
                </Label>
                <p className="text-muted-foreground">
                  Control whether this post is visible.
                </p>
              </div>
              <Switch
                id="is_published"
                checked={isPublished}
                onCheckedChange={(v) => form.setValue("is_published", v)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="published_at" className="text-xs font-medium">
                Publish date
              </Label>
              <Input
                id="published_at"
                type="datetime-local"
                value={form.watch("published_at") ?? ""}
                onChange={(e) =>
                  form.setValue("published_at", e.target.value || "")
                }
                className="h-8"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to publish immediately.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push("/posts")}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {post ? "Update" : "Publish"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm">
          <CardHeader className="border-b bg-muted px-3 py-2">
            <CardTitle className="text-sm font-medium">SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-3 py-3">
            <div className="space-y-2">
              <Label htmlFor="seo_title">SEO title</Label>
              <Input id="seo_title" {...form.register("seo_title")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_description">SEO description</Label>
              <Textarea
                id="seo_description"
                rows={3}
                {...form.register("seo_description")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm">
          <CardHeader className="border-b bg-muted px-3 py-2">
            <CardTitle className="text-sm font-medium">
              Featured Image & Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-3 py-3">
            <div className="space-y-2">
              <Label htmlFor="featured_image">Featured image URL</Label>
              <Input
                id="featured_image"
                placeholder="https://..."
                {...form.register("featured_image")}
              />
              {form.watch("featured_image") && (
                <div className="mt-2">
                  <img
                    src={form.watch("featured_image")}
                    alt="Featured preview"
                    className="h-24 w-full rounded border object-cover"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              {tags.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No tags available yet. You can seed tags in the backend or add
                  them later.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const selected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground hover:bg-muted"
                        }`}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer row intentionally minimal now; primary actions live in Publish box */}
      </div>
    </form>
  );
}

