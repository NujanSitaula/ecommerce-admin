"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, AlertTriangle, Package } from "lucide-react";
import { toast } from "sonner";
import type { Material } from "@/lib/types";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unit: "",
    current_stock: 0,
    low_stock_threshold: 0,
    cost_per_unit: 0,
    supplier: "",
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/materials");
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load materials:", error);
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (material?: Material) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name,
        description: material.description || "",
        unit: material.unit,
        current_stock: material.current_stock,
        low_stock_threshold: material.low_stock_threshold,
        cost_per_unit: material.cost_per_unit,
        supplier: material.supplier || "",
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        name: "",
        description: "",
        unit: "",
        current_stock: 0,
        low_stock_threshold: 0,
        cost_per_unit: 0,
        supplier: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = editingMaterial
        ? `/api/admin/materials/${editingMaterial.id}`
        : "/api/admin/materials";
      const method = editingMaterial ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save material");
      }

      toast.success(`Material ${editingMaterial ? "updated" : "created"} successfully`);
      setDialogOpen(false);
      loadMaterials();
    } catch (error) {
      console.error("Failed to save material:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save material");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this material?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/materials/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete material");
      }

      toast.success("Material deleted successfully");
      loadMaterials();
    } catch (error) {
      console.error("Failed to delete material:", error);
      toast.error("Failed to delete material");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0";
    const k = 1024;
    const sizes = ["", "K", "M", "G"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Materials Management</h1>
          <p className="text-muted-foreground">
            Manage raw materials and supplies for your products
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? "Edit Material" : "Add New Material"}
              </DialogTitle>
              <DialogDescription>
                {editingMaterial
                  ? "Update material information"
                  : "Add a new raw material or supply to your inventory"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Cotton Fabric"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">
                    Unit <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    placeholder="e.g., yards, kg, pieces"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Material description..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="current_stock">Current Stock</Label>
                  <Input
                    id="current_stock"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.current_stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        current_stock: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        low_stock_threshold: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost_per_unit">Cost Per Unit</Label>
                  <Input
                    id="cost_per_unit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_per_unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cost_per_unit: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier: e.target.value })
                  }
                  placeholder="Supplier name or company"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!formData.name || !formData.unit}>
                {editingMaterial ? "Update" : "Create"} Material
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading materials...</div>
      ) : materials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No materials yet. Add your first material to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Materials</CardTitle>
            <CardDescription>Manage your raw materials and supplies</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Cost/Unit</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => {
                  const isLowStock = material.current_stock <= material.low_stock_threshold;
                  return (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>{material.unit}</TableCell>
                      <TableCell>{material.current_stock}</TableCell>
                      <TableCell>{material.low_stock_threshold}</TableCell>
                      <TableCell>
                        ${Number(material.cost_per_unit || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>{material.supplier || "—"}</TableCell>
                      <TableCell>
                        {isLowStock ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="default">In Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(material)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(material.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

