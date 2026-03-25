"use client";

import { useState, useEffect, useCallback } from "react";
import { Grid3x3, List, Search, Image as ImageIcon, Video, File, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listMedia, formatFileSize, formatDuration } from "@/lib/media";
import type { Media, MediaListParams } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MediaGalleryProps {
  onSelect?: (media: Media) => void;
  onSelectMultiple?: (media: Media[]) => void;
  onPreview?: (media: Media) => void;
  selectionMode?: "single" | "multiple";
  selectedIds?: number[];
  filterType?: "image" | "video" | "document";
}

export function MediaGallery({
  onSelect,
  onSelectMultiple,
  onPreview,
  selectionMode = "single",
  selectedIds = [],
  filterType,
}: MediaGalleryProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video" | "document">(
    filterType || "all"
  );
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const [selectedMedia, setSelectedMedia] = useState<Media[]>([]);

  useEffect(() => {
    let cancelled = false;
    
    const loadMedia = async () => {
      try {
        setLoading(true);
        const params: MediaListParams = {
          page,
          per_page: 20,
          sort_by: "created_at",
          sort_order: "desc",
        };

        if (typeFilter !== "all") {
          params.type = typeFilter;
        }

        if (searchQuery) {
          params.search = searchQuery;
        }

        const response = await listMedia(params);
        
        // Don't update state if component unmounted or effect cancelled
        if (cancelled) {
          return;
        }
        
        setMedia(response.data || []);
        setPagination({
          current_page: response.current_page || 1,
          last_page: response.last_page || 1,
          per_page: response.per_page || 20,
          total: response.total || 0,
        });
        
        // Pre-select items based on selectedIds (only on initial load)
        if (selectedIds.length > 0 && page === 1) {
          const preSelected = (response.data || []).filter((m) => selectedIds.includes(m.id));
          setSelectedMedia(preSelected);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.error("Failed to load media:", error);
        setMedia([]);
        setPagination({
          current_page: 1,
          last_page: 1,
          per_page: 20,
          total: 0,
        });
      } finally {
        // Always set loading to false, even if cancelled
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    // Small delay to ensure component is fully mounted
    const timeoutId = setTimeout(() => {
      loadMedia();
    }, 0);

    // Cleanup function to cancel if component unmounts or dependencies change
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      setLoading(false);
    };
    // Only depend on values that should trigger a reload, not selectedIds
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, searchQuery]);

  const handleSelect = (item: Media) => {
    if (selectionMode === "multiple") {
      const isSelected = selectedMedia.some((m) => m.id === item.id);
      let newSelection: Media[];
      
      if (isSelected) {
        newSelection = selectedMedia.filter((m) => m.id !== item.id);
      } else {
        newSelection = [...selectedMedia, item];
      }
      
      setSelectedMedia(newSelection);
      onSelectMultiple?.(newSelection);
    } else {
      // If onPreview is provided, use it; otherwise use onSelect
      if (onPreview) {
        onPreview(item);
      } else {
        setSelectedMedia([item]);
        onSelect?.(item);
      }
    }
  };

  const isSelected = (id: number) => {
    return selectedMedia.some((m) => m.id === id);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleTypeFilter = (type: "all" | "image" | "video" | "document") => {
    setTypeFilter(type);
    setPage(1);
  };

  if (loading && media.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Type filters */}
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={typeFilter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleTypeFilter("all")}
            >
              All
            </Button>
            <Button
              variant={typeFilter === "image" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleTypeFilter("image")}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Images
            </Button>
            <Button
              variant={typeFilter === "video" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleTypeFilter("video")}
            >
              <Video className="h-4 w-4 mr-1" />
              Videos
            </Button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Media Grid/Table */}
      {media.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No media found</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {media.map((item) => (
            <Card
              key={item.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md overflow-hidden",
                isSelected(item.id) && "ring-2 ring-primary"
              )}
              onClick={() => handleSelect(item)}
            >
              <div className="relative aspect-square group">
                {item.file_type === "image" ? (
                  <img
                    src={item.thumbnail_url || item.url}
                    alt={item.alt_text || item.name}
                    className="w-full h-full object-cover"
                  />
                ) : item.file_type === "video" ? (
                  <div className="w-full h-full bg-muted relative overflow-hidden">
                    {item.thumbnail_url ? (
                      <>
                        <img
                          src={item.thumbnail_url}
                          alt={item.alt_text || item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if thumbnail fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.className = 'w-full h-full flex items-center justify-center';
                              fallback.innerHTML = '<svg class="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                        {/* Play overlay icon */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/30 rounded-full p-2">
                            <Video className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <File className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                
                {isSelected(item.id) && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground rounded-full p-2">
                      <div className="h-4 w-4 rounded-full bg-white" />
                    </div>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">{item.name}</p>
                  <div className="flex items-center gap-2 text-white/80 text-xs">
                    <Badge variant="secondary" className="text-xs">
                      {item.file_type}
                    </Badge>
                    <span>{formatFileSize(item.file_size)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Preview</TableHead>
                <TableHead>Media Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded Date</TableHead>
                <TableHead>Uploaded By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {media.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn(
                    "cursor-pointer",
                    isSelected(item.id) && "bg-muted"
                  )}
                  onClick={() => handleSelect(item)}
                >
                  <TableCell>
                    <div className="w-16 h-16 flex-shrink-0">
                      {item.file_type === "image" ? (
                        <img
                          src={item.thumbnail_url || item.url}
                          alt={item.alt_text || item.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : item.file_type === "video" ? (
                        <div className="w-full h-full bg-muted flex items-center justify-center rounded relative overflow-hidden">
                          {item.thumbnail_url ? (
                            <>
                              <img
                                src={item.thumbnail_url}
                                alt={item.alt_text || item.name}
                                className="w-full h-full object-cover rounded"
                              />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-black/20 rounded-full p-1">
                                  <Video className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <Video className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center rounded">
                          <File className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px]">
                      <p className="font-medium truncate" title={item.name}>
                        {item.name}
                      </p>
                      {item.alt_text && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {item.alt_text}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {item.file_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatFileSize(item.file_size)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    {item.user ? (
                      <div>
                        <p className="text-sm font-medium">
                          {item.user.name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.user.email}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.per_page && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{" "}
            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{" "}
            {pagination.total} media
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.current_page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                let pageNum: number;
                if (pagination.last_page <= 5) {
                  pageNum = i + 1;
                } else if (pagination.current_page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.current_page >= pagination.last_page - 2) {
                  pageNum = pagination.last_page - 4 + i;
                } else {
                  pageNum = pagination.current_page - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.current_page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    disabled={loading}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
              disabled={pagination.current_page === pagination.last_page || loading}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

