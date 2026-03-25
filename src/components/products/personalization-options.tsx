"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { ProductPersonalizationOption } from "@/lib/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PersonalizationOptionsProps {
  options: ProductPersonalizationOption[];
  onChange: (options: ProductPersonalizationOption[]) => void;
}

function SortableOptionItem({
  option,
  index,
  onUpdate,
  onDelete,
}: {
  option: ProductPersonalizationOption;
  index: number;
  onUpdate: (index: number, option: ProductPersonalizationOption) => void;
  onDelete: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id || `option-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-lg p-4 bg-card"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-6 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Option Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={option.name}
                onChange={(e) =>
                  onUpdate(index, { ...option, name: e.target.value })
                }
                placeholder="e.g., Custom Text, Color Choice"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={option.type}
                onValueChange={(value: ProductPersonalizationOption["type"]) =>
                  onUpdate(index, { ...option, type: value, options: value === "select" || value === "color" ? [] : undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="select">Select (Dropdown)</SelectItem>
                  <SelectItem value="color">Color</SelectItem>
                  <SelectItem value="file_upload">File Upload</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(option.type === "select" || option.type === "color") && (
            <div className="space-y-2">
              <Label>Options (one per line)</Label>
              <Textarea
                value={
                  Array.isArray(option.options)
                    ? option.options.join("\n")
                    : ""
                }
                onChange={(e) => {
                  const options = e.target.value
                    .split("\n")
                    .filter((o) => o.trim())
                    .map((o) => o.trim());
                  onUpdate(index, { ...option, options });
                }}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                rows={4}
              />
            </div>
          )}

          {option.type === "text" && (
            <div className="space-y-2">
              <Label>Max Length</Label>
              <Input
                type="number"
                min="1"
                value={option.max_length || ""}
                onChange={(e) =>
                  onUpdate(index, {
                    ...option,
                    max_length: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                placeholder="No limit"
              />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Price Adjustment</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={option.price_adjustment || ""}
                onChange={(e) =>
                  onUpdate(index, {
                    ...option,
                    price_adjustment: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                placeholder="0.00"
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id={`required-${index}`}
                checked={option.required}
                onCheckedChange={(checked) =>
                  onUpdate(index, { ...option, required: checked })
                }
              />
              <Label htmlFor={`required-${index}`} className="cursor-pointer">
                Required
              </Label>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onDelete(index)}
          className="mt-6"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function PersonalizationOptions({
  options,
  onChange,
}: PersonalizationOptionsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = options.findIndex(
        (opt) => (opt.id || `option-${options.indexOf(opt)}`) === active.id
      );
      const newIndex = options.findIndex(
        (opt) => (opt.id || `option-${options.indexOf(opt)}`) === over.id
      );

      const newOptions = arrayMove(options, oldIndex, newIndex).map(
        (opt, idx) => ({ ...opt, order: idx })
      );
      onChange(newOptions);
    }
  };

  const handleAdd = () => {
    const newOption: ProductPersonalizationOption = {
      id: Date.now(), // Temporary ID
      product_id: 0,
      name: "",
      type: "text",
      required: false,
      order: options.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onChange([...options, newOption]);
  };

  const handleUpdate = (index: number, updated: ProductPersonalizationOption) => {
    const newOptions = [...options];
    newOptions[index] = updated;
    onChange(newOptions);
  };

  const handleDelete = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index).map((opt, idx) => ({
      ...opt,
      order: idx,
    }));
    onChange(newOptions);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Personalization Options</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Add custom fields for personalized orders (e.g., custom text, color
              choices)
            </p>
          </div>
          <Button type="button" onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {options.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No personalization options yet.</p>
            <p className="text-sm mt-1">
              Click "Add Option" to create custom fields for this product.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={options.map(
                (opt, idx) => opt.id || `option-${idx}`
              )}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {options.map((option, index) => (
                  <SortableOptionItem
                    key={option.id || `option-${index}`}
                    option={option}
                    index={index}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}

