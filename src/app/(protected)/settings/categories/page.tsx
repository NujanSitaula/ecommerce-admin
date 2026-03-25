"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, FolderTree } from "lucide-react";
import { toast } from "sonner";
import type { AdminCategory } from "@/lib/types";

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parent_id: number | null;
  is_active: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(
    null
  );
  const [form, setForm] = useState<CategoryFormData>({
    name: "",
    slug: "",
    description: "",
    parent_id: null,
    is_active: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set("search", search.trim());
      }
      const response = await fetch(
        `/api/admin/categories${params.toString() ? `?${params.toString()}` : ""}`
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load categories");
      }
      const data = await response.json();
      const list: AdminCategory[] = Array.isArray(data) ? data : data.data ?? [];
      setCategories(list);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: AdminCategory) => {
    if (category) {
      setEditingCategory(category);
      setForm({
        name: category.name,
        slug: category.slug,
        description: category.description ?? "",
        parent_id: category.parent_id ?? null,
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      setForm({
        name: "",
        slug: "",
        description: "",
        parent_id: null,
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        description: form.description.trim() || null,
        is_active: form.is_active,
        parent_id: form.parent_id,
      };

      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg =
          data.errors?.name?.[0] ??
          data.errors?.slug?.[0] ??
          data.message ??
          "Failed to save category";
        throw new Error(msg);
      }

      toast.success(
        `Category ${editingCategory ? "updated" : "created"} successfully`
      );
      setDialogOpen(false);
      await loadCategories();
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save category"
      );
    }
  };

  const handleDeleteCategory = async (category: AdminCategory) => {
    if (
      !confirm(
        `Are you sure you want to delete category "${category.name}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const msg = data.message || "Failed to delete category";
        throw new Error(msg);
      }

      toast.success("Category deleted successfully");
      await loadCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category"
      );
    }
  };

  const tree = useMemo(() => {
    const byId = new Map<number, AdminCategory & { children: AdminCategory[] }>();
    categories.forEach((cat) => {
      byId.set(cat.id, { ...cat, children: [] });
    });
    const roots: (AdminCategory & { children: AdminCategory[] })[] = [];
    byId.forEach((cat) => {
      if (cat.parent_id && byId.has(cat.parent_id)) {
        byId.get(cat.parent_id)!.children.push(cat);
      } else {
        roots.push(cat);
      }
    });
    const sortCats = (list: (AdminCategory & { children: AdminCategory[] })[]) => {
      list.sort((a, b) => a.name.localeCompare(b.name));
      list.forEach((c) => sortCats(c.children));
    };
    sortCats(roots);
    return roots;
  }, [categories]);

  const flattenWithDepth = (
    nodes: (AdminCategory & { children: AdminCategory[] })[],
    depth = 0
  ): (AdminCategory & { depth: number })[] => {
    const result: (AdminCategory & { depth: number })[] = [];
    nodes.forEach((node) => {
      const { children, ...rest } = node;
      result.push({ ...(rest as AdminCategory), depth });
      if (children.length) {
        result.push(...flattenWithDepth(children, depth + 1));
      }
    });
    return result;
  };

  const rows = flattenWithDepth(tree);

  const availableParents = useMemo(
    () =>
      categories.filter((cat) =>
        editingCategory ? cat.id !== editingCategory.id : true
      ),
    [categories, editingCategory]
  );

  const canSave = form.name.trim() && form.slug.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage product categories and their hierarchy for navigation,
            merchandising, and reporting.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Tree</CardTitle>
          <CardDescription>
            Use parent relationships to build a structured navigation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              placeholder="Search by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  loadCategories();
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  loadCategories();
                }}
              >
                Reset
              </Button>
              <Button variant="outline" onClick={() => loadCategories()}>
                Apply
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading categories...
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <FolderTree className="mx-auto mb-4 h-10 w-10 opacity-40" />
              <p>No categories found. Add your first category to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((cat) => {
                  const parent = categories.find((c) => c.id === cat.parent_id);
                  return (
                    <TableRow key={cat.id}>
                      <TableCell>
                        <span
                          style={{
                            paddingLeft: `${cat.depth * 1.5}rem`,
                          }}
                          className="inline-flex items-center gap-2"
                        >
                          {cat.depth > 0 && (
                            <span className="h-px w-4 bg-border" aria-hidden />
                          )}
                          {cat.name}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {cat.slug}
                      </TableCell>
                      <TableCell>{parent ? parent.name : "—"}</TableCell>
                      <TableCell>
                        {cat.is_active ? "Active" : "Inactive"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(cat)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCategory(cat)}
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
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription>
              Create or update a category and optionally assign a parent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Men, Women, Accessories"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-slug"
                value={form.slug}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    slug: e.target.value.replace(/\s+/g, "-").toLowerCase(),
                  }))
                }
                placeholder="e.g., men, women, home-decor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Input
                id="cat-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Optional description used in SEO and merchandising"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-parent">Parent category</Label>
              <select
                id="cat-parent"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={form.parent_id ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    parent_id: e.target.value
                      ? parseInt(e.target.value, 10)
                      : null,
                  }))
                }
              >
                <option value="">No parent (top level)</option>
                {availableParents.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="cat-active"
                checked={form.is_active}
                onCheckedChange={(v) =>
                  setForm((prev) => ({ ...prev, is_active: v }))
                }
              />
              <Label htmlFor="cat-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={!canSave}>
              {editingCategory ? "Update" : "Create"} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

