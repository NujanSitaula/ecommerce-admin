"use client";

import { useState } from "react";
import { X, GripVertical, Image as ImageIcon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MediaSelector } from "@/components/media/media-selector";
import type { Media } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragCancelEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface ImageFile {
  id: string;
  url: string;
  thumbnail_url: string;
  original_name: string;
  path: string;
  file?: File;
  isUploading?: boolean;
  uploadProgress?: number;
  isFeatured?: boolean;
}

interface ImageUploadProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  productId?: number;
}

function SortableImageItem({
  image,
  onRemove,
  onSetFeatured,
  isOver,
  isDragging,
}: {
  image: ImageFile;
  onRemove: (id: string) => void;
  onSetFeatured: (id: string) => void;
  isOver?: boolean;
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isItemDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isItemDragging || isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <Card className={cn(
        "overflow-hidden transition-all duration-200",
        isOver && !isItemDragging && "ring-2 ring-primary ring-offset-2"
      )}>
        <div className="relative aspect-square">
          <img
            src={image.thumbnail_url || image.url}
            alt={image.original_name}
            className="w-full h-full object-cover"
          />
          {image.isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-sm">
                {image.uploadProgress ? `${image.uploadProgress}%` : "Uploading..."}
              </div>
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                image.isFeatured ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "bg-background/80"
              )}
              onClick={() => onSetFeatured(image.id)}
              title={image.isFeatured ? "Featured image" : "Set as featured image"}
            >
              <Star className={cn("h-4 w-4", image.isFeatured && "fill-current")} />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={() => onRemove(image.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded p-1"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          {image.isFeatured && (
            <div className="absolute bottom-2 left-2 right-2">
              <div className="bg-yellow-500 text-white text-xs font-medium px-2 py-1 rounded text-center">
                Featured
              </div>
            </div>
          )}
        </div>
        <div className="p-2 text-xs text-muted-foreground truncate">
          {image.original_name}
        </div>
      </Card>
    </div>
  );
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  productId,
}: ImageUploadProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [draggedImage, setDraggedImage] = useState<ImageFile | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const image = images.find((img) => img.id === active.id);
    setDraggedImage(image || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? (over.id as string) : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      const newImages = arrayMove(images, oldIndex, newIndex);
      onImagesChange(newImages);
    }

    // Reset drag state
    setActiveId(null);
    setOverId(null);
    setDraggedImage(null);
  };

  const handleDragCancel = () => {
    // Reset drag state on cancel
    setActiveId(null);
    setOverId(null);
    setDraggedImage(null);
  };

  const handleRemove = async (id: string) => {
    const image = images.find((img) => img.id === id);
    if (!image) return;

    try {
      // Delete from server
      await fetch(`/api/admin/products/images/${encodeURIComponent(image.path)}`, {
        method: "DELETE",
      });

      // Remove from local state
      const newImages = images.filter((img) => img.id !== id);
      
      // If removed image was featured, set first image as featured
      if (image.isFeatured && newImages.length > 0) {
        newImages[0].isFeatured = true;
      }
      
      onImagesChange(newImages);
    } catch (error) {
      console.error("Delete error:", error);
      // Still remove from UI even if server delete fails
      const newImages = images.filter((img) => img.id !== id);
      
      // If removed image was featured, set first image as featured
      if (image.isFeatured && newImages.length > 0) {
        newImages[0].isFeatured = true;
      }
      
      onImagesChange(newImages);
    }
  };

  const handleSetFeatured = (id: string) => {
    const newImages = images.map((img) => ({
      ...img,
      isFeatured: img.id === id,
    }));
    onImagesChange(newImages);
  };

  const handleGallerySelect = (media: Media) => {
    // Check if already selected
    const isAlreadySelected = images.some((img) => img.id === media.id.toString());
    if (isAlreadySelected) {
      return; // Don't add duplicates
    }

    // Convert Media to ImageFile format
    const imageFile: ImageFile = {
      id: media.id.toString(),
      url: media.url,
      thumbnail_url: media.thumbnail_url || media.url,
      original_name: media.name,
      path: media.path,
      isFeatured: images.length === 0, // First image is automatically featured
    };

    if (images.length + 1 > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    onImagesChange([...images, imageFile]);
  };

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={images.map((img) => img.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image) => (
              <SortableImageItem
                key={image.id}
                image={image}
                onRemove={handleRemove}
                onSetFeatured={handleSetFeatured}
                isOver={overId === image.id && activeId !== image.id}
                isDragging={activeId !== null}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {draggedImage ? (
            <div className="w-32 h-32 rounded-md overflow-hidden border-2 border-primary shadow-lg opacity-90 rotate-3">
              <img
                src={draggedImage.thumbnail_url || draggedImage.url}
                alt={draggedImage.original_name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {images.length < maxImages && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setGalleryOpen(true)}
          className="w-full h-auto py-8"
        >
          <ImageIcon className="h-6 w-6 mr-2" />
          <div className="text-left">
            <div className="font-medium">Select from Media Library</div>
            <div className="text-xs text-muted-foreground">
              Choose images from your media library
            </div>
          </div>
        </Button>
      )}

      <MediaSelector
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onSelect={handleGallerySelect}
        selectionMode="single"
        filterType="image"
        selectedIds={images.map((img) => parseInt(img.id)).filter((id) => !isNaN(id))}
        allowMultiple={true}
      />
    </div>
  );
}

