"use client";

import { useState, useEffect } from "react";
import { StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function QuickNoteWidget() {
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch("/api/admin/quick-note", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : { content: "" }))
        .then((data) => {
          setNote(data.content ?? "");
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleSave = async (value: string) => {
    setNote(value);
    await fetch("/api/admin/quick-note", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: value }),
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <StickyNote className="h-4 w-4" />
              <span className="sr-only">Quick note</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Quick note</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Quick note</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <Textarea
              placeholder="Jot something down..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={(e) => handleSave(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
