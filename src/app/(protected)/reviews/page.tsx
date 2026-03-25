"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { AlertTriangle, EyeOff, Star, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import type { Review, ReviewStatus } from "@/lib/types";

const STATUS_OPTIONS: ReviewStatus[] = [
  "pending",
  "approved",
  "rejected",
  "hidden",
];

function getStatusBadgeVariant(status: ReviewStatus): "default" | "secondary" | "destructive" {
  const variants: Record<ReviewStatus, "default" | "secondary" | "destructive"> = {
    pending: "secondary",
    approved: "default",
    rejected: "destructive",
    hidden: "secondary",
  };
  return variants[status] ?? "secondary";
}

export default function ReviewsPage() {
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>("pending");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reviews?status=${statusFilter}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as any).message || "Failed to load reviews");
      }

      const data = (await response.json()) as { data?: Review[] };
      setReviews(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load reviews",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const statusLabel = useMemo(() => {
    const label = statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
    return `Reviews (${label})`;
  }, [statusFilter]);

  const mutate = async (reviewId: string, action: "approve" | "reject" | "hide" | "delete") => {
    setProcessingId(reviewId);
    try {
      const url =
        action === "delete"
          ? `/api/admin/reviews/${reviewId}`
          : `/api/admin/reviews/${reviewId}/${action}`;

      const response = await fetch(url, {
        method: action === "delete" ? "DELETE" : "POST",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as any).message || `Failed to ${action} review`);
      }

      toast.success(
        action === "approve"
          ? "Review approved"
          : action === "reject"
            ? "Review rejected"
            : action === "hide"
              ? "Review hidden"
              : "Review deleted",
      );

      await loadReviews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action} review`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reviews Moderation</h1>
          <p className="text-muted-foreground">
            Review customer feedback, approve it for storefront visibility, or hide/reject it.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReviewStatus)}
            className="border rounded px-3 py-2 text-sm bg-background"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No reviews found for this filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const actionDisabled = processingId === review.id;

            const showApprove = review.status === "pending" || review.status === "rejected" || review.status === "hidden";
            const showReject = review.status === "pending";
            const showHide = review.status === "approved";

            return (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">
                          {review.title || "Untitled review"}
                        </h2>
                        <Badge variant={getStatusBadgeVariant(review.status)}>
                          {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                        </Badge>
                        {review.is_verified_purchase && (
                          <Badge variant="secondary">Verified purchase</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, idx) => (
                            <Star
                              key={idx}
                              className={`h-4 w-4 ${idx < review.rating ? "fill-brand" : "fill-muted"} text-brand`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {review.rating}/5
                        </span>
                      </div>

                      {review.product?.name && (
                        <p className="text-sm text-muted-foreground">
                          Product: {review.product.name}
                        </p>
                      )}

                      <p className="text-sm whitespace-pre-wrap">
                        {review.description}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        By <span className="font-medium">{review.author}</span>
                        {review.created_at ? ` • ${new Date(review.created_at).toLocaleString()}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      {showApprove && (
                        <Button
                          size="sm"
                          onClick={() => void mutate(review.id, "approve")}
                          disabled={actionDisabled}
                          variant="default"
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      )}
                      {showReject && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => void mutate(review.id, "reject")}
                          disabled={actionDisabled}
                        >
                          <ThumbsDown className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      )}
                      {showHide && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void mutate(review.id, "hide")}
                          disabled={actionDisabled}
                        >
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const ok = window.confirm(
                            "Delete this review? This cannot be undone.",
                          );
                          if (!ok) return;
                          void mutate(review.id, "delete");
                        }}
                        disabled={actionDisabled}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

