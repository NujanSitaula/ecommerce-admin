"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Menu, PanelLeftClose, PanelLeft, Settings } from "lucide-react";

const SIDEBAR_WIDTH = "w-56";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isGeneral = pathname === "/settings";
  const isTax = pathname === "/settings/tax";
  const isCoupons = pathname === "/settings/coupons";
  const currentLabel = isGeneral
    ? "General"
    : isTax
      ? "Tax Rates"
      : isCoupons
        ? "Coupons"
        : "Settings";

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-3.5rem)] flex-1 -m-4 md:-m-6">
      {/* Mobile: Sheet for sidebar */}
      <div className="md:hidden shrink-0 p-4 md:p-6 pt-0">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Menu className="h-4 w-4" />
              {currentLabel}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-left flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                Settings
              </SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <SettingsSidebar onNavigate={() => setSheetOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Full-height sidebar - snugged to left, toggleable */}
      <>
        <aside
          className={`hidden shrink-0 border-r md:flex flex-col bg-muted/30 transition-[width] duration-200 ${
            sidebarOpen ? SIDEBAR_WIDTH : "w-0 overflow-hidden"
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Settings className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span className="font-semibold truncate">Settings</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setSidebarOpen(false)}
              title="Hide settings sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <SettingsSidebar hideTitle />
          </div>
        </aside>

        {/* Collapsed sidebar - icons only with hover tooltips */}
        {!sidebarOpen && (
          <aside className="hidden md:flex flex-col border-r bg-muted/30 w-14 shrink-0 self-stretch">
            <div className="flex items-center justify-center p-4 border-b shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center w-9 h-9 rounded-md">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  Settings
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex-1 flex flex-col items-center py-4 gap-2 overflow-y-auto">
              <SettingsSidebar collapsed onNavigate={undefined} />
            </div>
            <div className="border-t p-2 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(true)}
                    className="w-full"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  Expand settings sidebar
                </TooltipContent>
              </Tooltip>
            </div>
          </aside>
        )}
      </>

      {/* Content - scrollable */}
      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-6">
        {children}
      </div>
    </div>
  );
}
