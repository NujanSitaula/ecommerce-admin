"use client";

import Link from "next/link";
import { ShoppingBag, Search, ShoppingCart } from "lucide-react";
import type { ActivityEvent } from "@/lib/types";

interface ActivityTimelineProps {
  events: ActivityEvent[];
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-[11px] top-1.5 bottom-1.5 w-px bg-border" />
      <ul className="space-y-1">
        {events.map((event, index) => {
          const isPlaceholder = event.type === "cart_placeholder";
          const orderId = event.metadata?.order_id as number | undefined;
          const Icon =
            event.type === "order"
              ? ShoppingBag
              : event.type === "search"
                ? Search
                : ShoppingCart;

          return (
            <li key={index} className="relative flex items-start gap-3 py-2">
              <div
                className={`relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted ${
                  isPlaceholder ? "text-muted-foreground/60" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-3 w-3" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm">{event.title}</span>
                  {!isPlaceholder && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(event.date)}
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[280px]">
                    {event.description}
                  </p>
                )}
                {orderId && (
                  <Link
                    href={`/orders/${orderId}`}
                    className="text-xs text-primary hover:underline mt-0.5 inline-block"
                  >
                    View order →
                  </Link>
                )}
                {isPlaceholder && (
                  <span className="text-[10px] text-muted-foreground/80 mt-0.5 inline-block">
                    Coming soon
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
