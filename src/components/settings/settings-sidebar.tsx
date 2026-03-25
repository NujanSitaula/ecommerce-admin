"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Percent, Store, Tag, Globe2, FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const SETTINGS_NAV = [
  { href: "/settings", label: "General", icon: Store },
  { href: "/settings/tax", label: "Tax Rates", icon: Percent },
  { href: "/settings/coupons", label: "Coupons", icon: Tag },
  { href: "/settings/countries", label: "Countries & States", icon: Globe2 },
  { href: "/settings/categories", label: "Categories", icon: FolderTree },
] as const;

interface SettingsSidebarProps {
  onNavigate?: () => void;
  className?: string;
  hideTitle?: boolean;
  collapsed?: boolean;
}

export function SettingsSidebar({ onNavigate, className, hideTitle, collapsed }: SettingsSidebarProps) {
  const pathname = usePathname();

  if (collapsed) {
    return (
      <nav className={cn("flex flex-col gap-1", className)}>
        {SETTINGS_NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center justify-center rounded-lg p-2 text-sm transition-colors",
                    active
                      ? "bg-zinc-100 dark:bg-zinc-700 text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {!hideTitle && (
        <div className="mb-4 flex items-center gap-2 px-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold">Settings</span>
        </div>
      )}
      {SETTINGS_NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-zinc-200 dark:bg-zinc-700 text-foreground font-medium"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
