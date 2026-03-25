"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Package, DollarSign, Receipt, Search } from "lucide-react";
import { toast } from "sonner";
import type { UserDetail, Order, Transaction } from "@/lib/types";
import { ActivityTimeline } from "@/components/users/activity-timeline";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to load user");
      }

      const responseData = await response.json();
      const userData = responseData.data || responseData;

      if (!userData || !userData.id) {
        toast.error("Invalid user data received");
        return;
      }

      setUser(userData);
    } catch (error) {
      console.error("Failed to load user:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load user"
      );
      router.push("/users");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getInitials = () => {
    if (!user) return "?";
    if (user.name) {
      return user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    return user.email[0]?.toUpperCase() || "?";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to users
          </Link>
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          Loading user...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const recentOrders = Array.isArray(user.recent_orders)
    ? user.recent_orders
    : (user.recent_orders as { data?: Order[] } | undefined)?.data ?? [];
  const recentTransactions = Array.isArray(user.recent_transactions)
    ? user.recent_transactions
    : (user.recent_transactions as { data?: Transaction[] } | undefined)?.data ?? [];

  const stats = [
    {
      label: "Orders",
      value: user.stats?.orders_count ?? 0,
      icon: Package,
    },
    {
      label: "Total Spent",
      value: formatCurrency(user.stats?.total_spent ?? 0),
      icon: DollarSign,
    },
    {
      label: "Transactions",
      value: user.stats?.transactions_count ?? 0,
      icon: Receipt,
    },
    {
      label: "Searches",
      value: user.stats?.search_count ?? 0,
      icon: Search,
    },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/users">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to users
        </Link>
      </Button>

      {/* Profile card */}
      <Card className="py-4">
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{user.name || "No name"}</h1>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="capitalize text-sm">
                  {user.role || "customer"}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  Joined {formatDate(user.created_at || new Date().toISOString())}
                </span>
              </div>
              {user.phone && (
                <p className="text-sm text-muted-foreground mt-1">
                  {user.phone}
                </p>
              )}
              {user.country && (
                <p className="text-sm text-muted-foreground">{user.country}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="py-4">
              <CardContent className="flex flex-col gap-1 px-4 pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </span>
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="text-xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="search">Search History</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {user.activity_timeline && user.activity_timeline.length > 0 ? (
                <ActivityTimeline events={user.activity_timeline} />
              ) : (
                <p className="text-muted-foreground py-4">
                  No activity recorded yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {recentOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">
                          #{order.id}
                        </TableCell>
                        <TableCell>
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell className="capitalize">
                          {order.status}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(order.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/orders/${order.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No orders yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {recentTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono">#{tx.id}</TableCell>
                        <TableCell className="capitalize">{tx.type}</TableCell>
                        <TableCell className="capitalize">
                          {tx.status}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(tx.amount)}
                          {tx.type?.includes("refund") && " (refund)"}
                        </TableCell>
                        <TableCell>{formatDate(tx.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No transactions yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {user.search_history && user.search_history.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.search_history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          &quot;{item.query}&quot;
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(item.searched_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No search history
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
