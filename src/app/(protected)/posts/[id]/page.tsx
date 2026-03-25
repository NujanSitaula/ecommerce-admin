"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PostForm } from "@/components/posts/post-form";
import type { AdminPost } from "@/lib/types";
import { toast } from "sonner";

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [post, setPost] = useState<AdminPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/posts/${id}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to load post");
        }
        const data = (await res.json()) as AdminPost;
        setPost(data);
      } catch (error) {
        console.error("Failed to load post:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to load post"
        );
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [id]);

  if (loading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Loading post...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Post not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Edit Post</h1>
        <p className="text-muted-foreground">
          Update the content, status, and metadata for this post.
        </p>
      </div>
      <PostForm post={post} />
    </div>
  );
}

