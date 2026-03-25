"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  DollarSign,
  ShoppingCart,
  Package,
  XCircle,
  Users,
  AlertTriangle,
  Trophy,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import type { DashboardStats } from "@/lib/types";

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const ordersChartConfig = {
  count: {
    label: "Orders",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [revenuePeriod, setRevenuePeriod] = useState<"today" | "month">("today");
  const [chartDays, setChartDays] = useState(7);

  useEffect(() => {
    loadDashboard();
  }, [chartDays]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/dashboard?days=${chartDays}`);
      if (!response.ok) throw new Error("Failed to load dashboard");
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const revenueValue =
    revenuePeriod === "today"
      ? data?.total_revenue_today ?? 0
      : data?.total_revenue_month ?? 0;

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(revenueValue),
      icon: DollarSign,
      extra: (
        <Tabs value={revenuePeriod} onValueChange={(v: string) => setRevenuePeriod(v as "today" | "month")}>
          <TabsList className="h-7 text-xs">
            <TabsTrigger value="today" className="px-2 text-xs">Today</TabsTrigger>
            <TabsTrigger value="month" className="px-2 text-xs">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      ),
    },
    { label: "Total Orders", value: data?.total_orders ?? "—", icon: ShoppingCart, extra: null },
    { label: "Pending Orders", value: data?.pending_orders ?? "—", icon: Package, extra: null },
    { label: "Cancelled / Refunded", value: data?.cancelled_refunded_orders ?? "—", icon: XCircle, extra: null },
    { label: "Total Customers", value: data?.total_customers ?? "—", icon: Users, extra: null },
    { label: "Low Stock Products", value: data?.low_stock_count ?? "—", icon: AlertTriangle, extra: null },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Quick glance at store activity and trends
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="py-4">
              <CardContent className="flex flex-col gap-1 px-4 pt-0">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="py-4">
                <CardContent className="flex flex-col gap-1 px-4 pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {stat.extra ?? null}
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="text-xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Trends</h2>
        <Tabs value={String(chartDays)} onValueChange={(v) => setChartDays(Number(v))}>
          <TabsList className="h-8 text-xs">
            <TabsTrigger value="7" className="px-2 text-xs">7 days</TabsTrigger>
            <TabsTrigger value="30" className="px-2 text-xs">30 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="py-4">
          <CardContent className="pt-0">
            <h3 className="mb-4 font-semibold">Revenue Trend</h3>
            {loading ? (
              <div className="h-[200px] animate-pulse rounded bg-muted" />
            ) : data?.revenue_trend?.length ? (
              <ChartContainer config={revenueChartConfig} className="h-[200px] w-full">
                <AreaChart data={data.revenue_trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${v}`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    fill="var(--color-revenue)"
                    fillOpacity={0.2}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No revenue data
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="pt-0">
            <h3 className="mb-4 font-semibold">Orders Trend</h3>
            {loading ? (
              <div className="h-[200px] animate-pulse rounded bg-muted" />
            ) : data?.orders_trend?.length ? (
              <ChartContainer config={ordersChartConfig} className="h-[200px] w-full">
                <BarChart data={data.orders_trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No orders data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="py-4">
          <CardContent className="pt-0">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Trophy className="h-4 w-4" />
              Top Selling Products
            </h3>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : data?.top_products?.length ? (
              <ul className="space-y-2">
                {data.top_products.map((p, i) => (
                  <li key={`${p.product_id}-${i}`} className="flex items-center justify-between">
                    <Link
                      href={`/products/${p.product_id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {p.product_name}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {p.quantity_sold} sold
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No products sold yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="pt-0">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Layers className="h-4 w-4" />
              Top Categories
            </h3>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : data?.top_categories?.length ? (
              <ul className="space-y-2">
                {data.top_categories.map((c) => (
                  <li key={c.category_id} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.category_name}</span>
                    <span className="text-sm text-muted-foreground">
                      {c.order_count} orders
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No category data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
