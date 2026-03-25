"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  Menu,
  Image as ImageIcon,
  Warehouse,
  Boxes,
  ShoppingCart,
  Factory,
  Receipt,
  DollarSign,
  Users,
  FileText,
  Star,
} from "lucide-react";
import { ReactNode, useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Separator } from "./ui/separator";
import { QuickNoteWidget } from "./header/quick-note-widget";
import { TodoWidget } from "./header/todo-widget";
import { GreetingBanner } from "./header/greeting-banner";
import type { SessionUser } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/users", label: "Users", icon: Users },
  { href: "/production", label: "Production", icon: Factory },
  { href: "/inventory", label: "Inventory", icon: Warehouse },
  { href: "/materials", label: "Materials", icon: Boxes },
  { href: "/media", label: "Media Library", icon: ImageIcon },
  { href: "/refunds", label: "Refunds", icon: Receipt },
  { href: "/transactions", label: "Transactions", icon: DollarSign },
   { href: "/posts", label: "Blog", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

function SidebarNav({
  user,
  pathname,
}: {
  user: SessionUser;
  pathname: string;
}) {
  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2) || user.email?.[0]?.toUpperCase() || "A";

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r bg-card/40 p-4 md:flex md:flex-col">
      <div className="mb-6">
        <Link href="/dashboard" className="group/brand text-lg font-semibold inline-flex items-center gap-2 cursor-pointer">
          <span className="relative inline-flex min-w-[2.75rem] overflow-hidden rounded-md bg-primary px-2 py-1 text-primary-foreground transition-[min-width] duration-300 ease-out group-hover/brand:min-w-[7.25rem]">
            <span className="relative flex min-h-[1.25rem] w-full min-w-0 items-center justify-center">
              <span className="absolute inset-0 flex items-center justify-center whitespace-nowrap [backface-visibility:hidden] transition-opacity duration-100 group-hover/brand:opacity-0">
                SC
              </span>
              <span className="absolute inset-0 flex items-center justify-center whitespace-nowrap opacity-0 [backface-visibility:hidden] transition-opacity duration-100 delay-75 group-hover/brand:opacity-100 group-hover/brand:delay-0 group-hover/brand:animate-brand-pop">
                ShotCoder
              </span>
            </span>
          </span>
          <span>Panel</span>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition hover:bg-muted ${active ? "bg-muted font-medium" : ""}`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Separator className="my-4" />
      <div className="flex items-center gap-3 rounded-md p-2">
        <Avatar className="h-9 w-9">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{user?.name || "Admin"}</span>
          <span className="text-xs text-muted-foreground">
            {user.email}
          </span>
        </div>
      </div>
    </aside>
  );
}

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user: SessionUser;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2) || user.email?.[0]?.toUpperCase() || "A";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SidebarNav user={user} pathname={pathname} />
      <div className="flex flex-1 flex-col">
        <header
          className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background px-4 transition-transform duration-300 ease-out"
          style={{ transform: headerVisible ? "translateY(0)" : "translateY(-100%)" }}
        >
          <div className="flex items-center gap-3 md:hidden">
            {mounted ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <div className="p-4 text-lg font-semibold">
                    <Link href="/dashboard" className="group/brand inline-flex items-center gap-2 cursor-pointer">
                      <span className="relative inline-flex min-w-[2.75rem] overflow-hidden rounded-md bg-primary px-2 py-1 text-primary-foreground transition-[min-width] duration-300 ease-out group-hover/brand:min-w-[7.25rem]">
                        <span className="relative flex min-h-[1.25rem] w-full min-w-0 items-center justify-center">
                          <span className="absolute inset-0 flex items-center justify-center whitespace-nowrap [backface-visibility:hidden] transition-opacity duration-100 group-hover/brand:opacity-0">SC</span>
                          <span className="absolute inset-0 flex items-center justify-center whitespace-nowrap opacity-0 [backface-visibility:hidden] transition-opacity duration-100 delay-75 group-hover/brand:opacity-100 group-hover/brand:delay-0 group-hover/brand:animate-brand-pop">ShotCoder</span>
                        </span>
                      </span>
                      <span>Panel</span>
                    </Link>
                  </div>
                  <Separator />
                  <nav className="flex flex-col gap-1 p-4">
                    {navItems.map((item) => {
                      const active = pathname.startsWith(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition hover:bg-muted ${active ? "bg-muted font-medium" : ""}`}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>
                </SheetContent>
              </Sheet>
            ) : (
              <Button variant="outline" size="icon" disabled>
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <span className="text-lg font-semibold">Admin</span>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <GreetingBanner userName={user?.name} />
          </div>
          <div className="flex items-center gap-1">
            <QuickNoteWidget />
            <TodoWidget />
          </div>
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 px-3"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">
                    {user?.name || "Admin"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user?.name || "Admin"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              className="flex items-center gap-2 px-3"
              disabled
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">
                {user?.name || "Admin"}
              </span>
            </Button>
          )}
        </header>
        <main className="flex-1 bg-muted/40 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

