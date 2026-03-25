"use client";

import { PostForm } from "@/components/posts/post-form";

export default function NewPostPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">New Post</h1>
        <p className="text-muted-foreground">
          Create a new blog post for your store.
        </p>
      </div>
      <PostForm post={null} />
    </div>
  );
}

