"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AdminPost } from "@/lib/types";

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function computeStatus(post: AdminPost): "draft" | "scheduled" | "published" {
  if (!post.is_published) return "draft";
  if (post.published_at && new Date(post.published_at) > new Date()) {
    return "scheduled";
  }
  return "published";
}

export default function PostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "draft" | "published">(
    ""
  );
  const router = useRouter();

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      const response = await fetch(
        `/api/admin/posts${params.toString() ? `?${params.toString()}` : ""}`
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load posts");
      }
      const data = await response.json();
      const list: AdminPost[] = Array.isArray(data)
        ? data
        : data.data ?? data;
      setPosts(list);
    } catch (error) {
      console.error("Failed to load posts:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load posts"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (post: AdminPost) => {
    if (
      !confirm(
        `Are you sure you want to delete the post "${post.title}"? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/posts/${post.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete post");
      }
      toast.success("Post deleted successfully");
      await loadPosts();
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete post"
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground">
            Write, schedule, and publish content for your store.
          </p>
        </div>
        <Button onClick={() => router.push("/posts/new")}>
          New Post
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Posts</CardTitle>
          <CardDescription>
            Filter and manage your blog content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Search by title or slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    loadPosts();
                  }
                }}
              />
              <select
                className="flex h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "" | "draft" | "published")
                }
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  loadPosts();
                }}
              >
                Reset
              </Button>
              <Button variant="outline" onClick={loadPosts}>
                Apply
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <p>No posts yet. Create your first blog post to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => {
                  const status = computeStatus(post);
                  return (
                    <TableRow key={post.id}>
                      <TableCell className="max-w-md">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium truncate">
                            {post.title}
                          </span>
                          <span className="text-xs text-muted-foreground break-all">
                            {post.slug}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {status === "published" && (
                          <Badge variant="default">Published</Badge>
                        )}
                        {status === "draft" && (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {post.author?.name || post.author?.email || "—"}
                      </TableCell>
                      <TableCell>{formatDate(post.published_at)}</TableCell>
                      <TableCell>{formatDate(post.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={`/posts/${post.id}`}>Edit</Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(post)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

