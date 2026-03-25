"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, AlertTriangle, Clock, TrendingDown, Plus } from "lucide-react";
import Link from "next/link";
import type { Product, InventoryTransaction } from "@/lib/types";

interface InventoryStats {
  totalProducts: number;
  lowStockItems: number;
  madeToOrderItems: number;
}

export default function InventoryDashboard() {
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    lowStockItems: 0,
    madeToOrderItems: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stats and low stock items
      const [inventoryRes, lowStockRes, transactionsRes] = await Promise.all([
        fetch("/api/admin/inventory?per_page=1"),
        fetch("/api/admin/inventory/low-stock?per_page=5"),
        fetch("/api/admin/inventory/transactions?per_page=10"),
      ]);

      if (inventoryRes.ok) {
        const inventoryData = await inventoryRes.json();
        setStats({
          totalProducts: inventoryData.total || 0,
          lowStockItems: inventoryData.total || 0,
          madeToOrderItems: 0, // Will need separate endpoint for this
        });
      }

      if (lowStockRes.ok) {
        const lowStockData = await lowStockRes.json();
        setLowStockProducts(lowStockData.data || []);
        setStats((prev) => ({ ...prev, lowStockItems: lowStockData.total || 0 }));
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setRecentTransactions(transactionsData.data || []);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
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

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      sale: "destructive",
      purchase: "default",
      adjustment: "secondary",
      return: "default",
      damage: "destructive",
      production: "outline",
    };
    return colors[type] || "secondary";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Monitor stock levels, track inventory, and manage made-to-order items
          </p>
        </div>
        <Link href="/materials">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Manage Materials
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Products in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Items below threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Made-to-Order</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.madeToOrderItems}</div>
            <p className="text-xs text-muted-foreground">Custom order items</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>Products that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : lowStockProducts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No low stock items</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Threshold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Link
                          href={`/inventory/${product.id}`}
                          className="font-medium hover:underline"
                        >
                          {product.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-500 font-medium">{product.quantity || 0}</span>
                      </TableCell>
                      <TableCell>{product.low_stock_threshold || 5}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {lowStockProducts.length > 0 && (
              <div className="mt-4">
                <Link href="/inventory?low_stock=1">
                  <Button variant="outline" className="w-full">
                    View All Low Stock Items
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Inventory Transactions</CardTitle>
            <CardDescription>Latest inventory movements</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No transactions yet</div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getTransactionTypeColor(transaction.type) as any}>
                          {transaction.type}
                        </Badge>
                        <span className="text-sm font-medium">
                          {transaction.product?.name || "Product"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {transaction.previous_quantity} → {transaction.new_quantity}
                        {transaction.notes && ` • ${transaction.notes}`}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link href="/inventory/transactions">
                <Button variant="outline" className="w-full">
                  View All Transactions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

