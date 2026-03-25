"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import type { Material, ProductMaterial } from "@/lib/types";

interface MaterialsManagerProps {
  materials: ProductMaterial[];
  onChange: (materials: ProductMaterial[]) => void;
}

export function MaterialsManager({ materials, onChange }: MaterialsManagerProps) {
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/materials");
      if (response.ok) {
        const data = await response.json();
        setAvailableMaterials(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load materials:", error);
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    const newMaterial: ProductMaterial = {
      id: Date.now(), // Temporary ID
      product_id: 0,
      material_id: 0,
      quantity_required: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onChange([...materials, newMaterial]);
  };

  const handleUpdate = (index: number, updated: Partial<ProductMaterial>) => {
    const newMaterials = [...materials];
    newMaterials[index] = { ...newMaterials[index], ...updated };
    onChange(newMaterials);
  };

  const handleDelete = (index: number) => {
    const newMaterials = materials.filter((_, i) => i !== index);
    onChange(newMaterials);
  };

  const getMaterialById = (materialId: number) => {
    return availableMaterials.find((m) => m.id === materialId);
  };

  const getAvailableMaterialOptions = () => {
    const usedMaterialIds = materials.map((m) => m.material_id).filter((id) => id > 0);
    return availableMaterials.filter((m) => !usedMaterialIds.includes(m.id));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Materials Required</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Specify which materials are needed to produce this product
            </p>
          </div>
          <Button type="button" onClick={handleAdd} size="sm" disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && materials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Loading materials...</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No materials assigned yet.</p>
            <p className="text-sm mt-1">
              Click "Add Material" to specify materials needed for this product.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {materials.map((productMaterial, index) => {
              const material = getMaterialById(productMaterial.material_id);
              const availableOptions = getAvailableMaterialOptions();
              // Include current material in options if it exists
              const allOptions = material
                ? [material, ...availableOptions.filter((m) => m.id !== material.id)]
                : availableOptions;

              return (
                <div
                  key={productMaterial.id || `material-${index}`}
                  className="border rounded-lg p-4 bg-card"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>
                            Material <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={productMaterial.material_id?.toString() || ""}
                            onValueChange={(value) => {
                              const selectedMaterial = availableMaterials.find(
                                (m) => m.id === parseInt(value)
                              );
                              handleUpdate(index, {
                                material_id: parseInt(value),
                                material: selectedMaterial,
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a material" />
                            </SelectTrigger>
                            <SelectContent>
                              {allOptions.map((mat) => {
                                const isLowStock = mat.current_stock <= mat.low_stock_threshold;
                                return (
                                  <SelectItem key={mat.id} value={mat.id.toString()}>
                                    {mat.name} ({mat.unit})
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Quantity Required <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={productMaterial.quantity_required || ""}
                            onChange={(e) =>
                              handleUpdate(index, {
                                quantity_required: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0.00"
                          />
                          {material && (
                            <p className="text-xs text-muted-foreground">
                              Available: {material.current_stock} {material.unit}
                            </p>
                          )}
                        </div>
                      </div>

                      {material && (
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {material.description || "No description"}
                          </span>
                          {material.supplier && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                Supplier: {material.supplier}
                              </span>
                            </>
                          )}
                          {Number(material.cost_per_unit ?? 0) > 0 && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                Cost: ${Number(material.cost_per_unit).toFixed(2)}/{material.unit}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(index)}
                      className="mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

