"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Calendar, Search, Filter, X } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/lib/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    production_status: "",
    search: "",
    date_from: "",
    date_to: "",
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  useEffect(() => {
    loadOrders();
  }, [filters, pagination.current_page]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.status) params.append("status", filters.status);
      if (filters.production_status) params.append("production_status", filters.production_status);
      if (filters.search) params.append("search", filters.search);
      if (filters.date_from) params.append("date_from", filters.date_from);
      if (filters.date_to) params.append("date_to", filters.date_to);
      params.append("page", pagination.current_page.toString());
      params.append("per_page", pagination.per_page.toString());

      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to load orders");
      }

      const data = await response.json();
      setOrders(data.data || []);
      setPagination({
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        per_page: data.per_page || 20,
        total: data.total || 0,
      });
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      production_status: "",
      search: "",
      date_from: "",
      date_to: "",
    });
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "secondary",
      confirmed: "default",
      processing: "default",
      shipped: "default",
      delivered: "default",
      cancelled: "destructive",
    };
    return colors[status] || "secondary";
  };

  const getProductionStatus = (order: Order) => {
    const madeToOrderItems = order.items?.filter((item) => item.is_made_to_order) || [];
    if (madeToOrderItems.length === 0) return null;

    const statuses = madeToOrderItems.map((item) => item.production_status);
    if (statuses.every((s) => s === "completed")) return "completed";
    if (statuses.some((s) => s === "in_progress")) return "in_progress";
    if (statuses.some((s) => s === "pending")) return "pending";
    return statuses[0] || null;
  };

  const getProductionStatusColor = (status: string | null) => {
    if (!status) return "secondary";
    const colors: Record<string, string> = {
      pending: "secondary",
      in_progress: "default",
      completed: "default",
      cancelled: "destructive",
    };
    return colors[status] || "secondary";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getCustomerName = (order: Order) => {
    if (order.user) {
      return order.user.name || order.user.email;
    }
    return order.guest_name || order.guest_email || "Guest";
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            Manage and track all customer orders
          </p>
        </div>
        <Link href="/production">
          <Button variant="outline">
            Production Management
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="py-4">
        <CardContent className="pt-0">
          <div className="grid gap-4 md:grid-cols-6">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders, customer..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select
              value={filters.status || "all"}
              onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.production_status || "all"}
              onValueChange={(value) => handleFilterChange("production_status", value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Production Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Production</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From Date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange("date_from", e.target.value)}
            />

            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="To Date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange("date_to", e.target.value)}
              />
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearFilters}
                  title="Clear filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No orders found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Production</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const productionStatus = getProductionStatus(order);
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono font-medium">
                            #{order.id}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {getCustomerName(order)}
                              </div>
                              {order.guest_email && (
                                <div className="text-xs text-muted-foreground">
                                  Guest Order
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(order.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(order.status) as any}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {productionStatus ? (
                              <Badge variant={getProductionStatusColor(productionStatus) as any}>
                                {productionStatus.replace("_", " ")}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(order.total)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/orders/${order.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <div className="flex items-center justify-between border-t p-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{" "}
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{" "}
                    {pagination.total} orders
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((p) => ({
                          ...p,
                          current_page: Math.max(1, p.current_page - 1),
                        }))
                      }
                      disabled={pagination.current_page === 1 || loading}
                    >
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {pagination.current_page} of {pagination.last_page}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((p) => ({
                          ...p,
                          current_page: Math.min(pagination.last_page, p.current_page + 1),
                        }))
                      }
                      disabled={pagination.current_page === pagination.last_page || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

