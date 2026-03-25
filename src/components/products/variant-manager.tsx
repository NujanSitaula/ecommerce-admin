"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProductVariant } from "@/lib/types";

interface VariantManagerProps {
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
}

interface VariantAttribute {
  name: string;
  values: string[];
}

export function VariantManager({
  variants,
  onVariantsChange,
}: VariantManagerProps) {
  const [attributes, setAttributes] = useState<VariantAttribute[]>([]);
  const [showAttributeForm, setShowAttributeForm] = useState(false);
  const [newAttributeName, setNewAttributeName] = useState("");
  const [newAttributeValue, setNewAttributeValue] = useState("");

  const generateVariants = () => {
    if (attributes.length === 0) {
      onVariantsChange([]);
      return;
    }

    // Generate all combinations
    const combinations: Record<string, string>[] = [];
    const generateCombinations = (
      current: Record<string, string>,
      remaining: VariantAttribute[]
    ) => {
      if (remaining.length === 0) {
        combinations.push({ ...current });
        return;
      }

      const [first, ...rest] = remaining;
      first.values.forEach((value) => {
        generateCombinations({ ...current, [first.name]: value }, rest);
      });
    };

    generateCombinations({}, attributes);

    // Create variant objects
    const newVariants: ProductVariant[] = combinations.map((attrs, index) => {
      const existing = variants.find((v) =>
        Object.keys(attrs).every(
          (key) => v.attributes[key] === attrs[key]
        )
      );

      return (
        existing || {
          id: `temp-${Date.now()}-${index}`,
          product_id: "",
          attributes: attrs,
          quantity: 0,
        }
      );
    });

    onVariantsChange(newVariants);
  };

  const addAttribute = () => {
    if (!newAttributeName || !newAttributeValue) return;

    const existing = attributes.find((a) => a.name === newAttributeName);
    if (existing) {
      if (!existing.values.includes(newAttributeValue)) {
        existing.values.push(newAttributeValue);
        setAttributes([...attributes]);
      }
    } else {
      setAttributes([
        ...attributes,
        { name: newAttributeName, values: [newAttributeValue] },
      ]);
    }

    setNewAttributeValue("");
    generateVariants();
  };

  const removeAttribute = (name: string) => {
    setAttributes(attributes.filter((a) => a.name !== name));
    generateVariants();
  };

  const removeAttributeValue = (attrName: string, value: string) => {
    const attr = attributes.find((a) => a.name === attrName);
    if (attr) {
      attr.values = attr.values.filter((v) => v !== value);
      setAttributes([...attributes]);
      generateVariants();
    }
  };

  const updateVariant = (id: string, updates: Partial<ProductVariant>) => {
    onVariantsChange(
      variants.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  };

  const removeVariant = (id: string) => {
    onVariantsChange(variants.filter((v) => v.id !== id));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Product Variants</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Create variants with different attributes (e.g., Size, Color)
        </p>
      </div>

      {/* Attributes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Variant Attributes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {attributes.map((attr) => (
            <div key={attr.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium capitalize">{attr.name}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttribute(attr.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {attr.values.map((value) => (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {value}
                    <button
                      type="button"
                      onClick={() => removeAttributeValue(attr.name, value)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ))}

          {showAttributeForm ? (
            <div className="space-y-2 p-4 border rounded-md">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Attribute name (e.g., Size)"
                  value={newAttributeName}
                  onChange={(e) => setNewAttributeName(e.target.value)}
                />
                <Input
                  placeholder="Value (e.g., L)"
                  value={newAttributeValue}
                  onChange={(e) => setNewAttributeValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAttribute();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={addAttribute}>
                  Add Value
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowAttributeForm(false);
                    setNewAttributeName("");
                    setNewAttributeValue("");
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAttributeForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Attribute
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Variants */}
      {variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Variants ({variants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-md"
                >
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground">
                      Attributes
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(variant.attributes).map(([key, value]) => (
                        <Badge key={key} variant="outline">
                          {key}: {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">SKU</Label>
                    <Input
                      size="sm"
                      value={variant.sku || ""}
                      onChange={(e) =>
                        updateVariant(variant.id, { sku: e.target.value })
                      }
                      placeholder="SKU"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      size="sm"
                      value={variant.price || ""}
                      onChange={(e) =>
                        updateVariant(variant.id, {
                          price: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="Override price"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Stock</Label>
                      <Input
                        type="number"
                        size="sm"
                        value={variant.quantity}
                        onChange={(e) =>
                          updateVariant(variant.id, {
                            quantity: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariant(variant.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

