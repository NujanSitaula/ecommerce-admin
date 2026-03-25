"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaGallery } from "./media-gallery";
import { MediaUpload } from "./media-upload";
import type { Media } from "@/lib/types";

interface MediaSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (media: Media) => void;
  onSelectMultiple?: (media: Media[]) => void;
  selectionMode?: "single" | "multiple";
  filterType?: "image" | "video" | "document";
  selectedIds?: number[];
  allowMultiple?: boolean; // Allow selecting multiple items even in single mode (for product images)
}

export function MediaSelector({
  open,
  onOpenChange,
  onSelect,
  onSelectMultiple,
  selectionMode = "single",
  filterType,
  selectedIds = [],
  allowMultiple = false,
}: MediaSelectorProps) {
  const [activeTab, setActiveTab] = useState<"gallery" | "upload">("gallery");
  const [selectedMedia, setSelectedMedia] = useState<Media[]>([]);

  const handleSelect = (media: Media) => {
    if (selectionMode === "single" && !allowMultiple) {
      onSelect?.(media);
      onOpenChange(false);
    } else {
      // Allow multiple selections even in single mode if allowMultiple is true
      const isSelected = selectedMedia.some((m) => m.id === media.id);
      if (isSelected) {
        setSelectedMedia(selectedMedia.filter((m) => m.id !== media.id));
      } else {
        setSelectedMedia([...selectedMedia, media]);
      }
    }
  };

  const handleSelectMultiple = (media: Media[]) => {
    setSelectedMedia(media);
  };

  const handleConfirm = () => {
    if (selectedMedia.length > 0) {
      onSelectMultiple?.(selectedMedia);
      onOpenChange(false);
      setSelectedMedia([]);
    }
  };

  const handleUploadComplete = () => {
    setActiveTab("gallery");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedMedia([]);
  };

  const handleConfirmSelection = () => {
    if (allowMultiple && selectedMedia.length > 0) {
      // Call onSelect for each selected media (for product images)
      selectedMedia.forEach((media) => {
        onSelect?.(media);
      });
      onOpenChange(false);
      setSelectedMedia([]);
    } else if (selectedMedia.length > 0) {
      onSelectMultiple?.(selectedMedia);
      onOpenChange(false);
      setSelectedMedia([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="!w-[98vw] !max-w-[98vw] !h-[98vh] !max-h-[98vh] overflow-hidden flex flex-col p-0 gap-0"
        style={{ width: '98vw', maxWidth: '98vw', height: '98vh', maxHeight: '98vh' }}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>
            {selectionMode === "single" && !allowMultiple ? "Select Media" : "Select Media"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "gallery" | "upload")} className="flex-1 overflow-hidden flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 m-4 mb-0 shrink-0">
            <TabsTrigger value="gallery">Media Library</TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="flex-1 overflow-auto mt-4 px-4 min-h-0">
            <MediaGallery
              onSelect={handleSelect}
              onSelectMultiple={handleSelectMultiple}
              selectionMode={allowMultiple ? "multiple" : selectionMode}
              selectedIds={[...selectedIds, ...selectedMedia.map((m) => m.id)]}
              filterType={filterType}
            />
          </TabsContent>

          <TabsContent value="upload" className="flex-1 overflow-auto mt-4 px-4 min-h-0">
            <MediaUpload onUploadComplete={handleUploadComplete} />
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {(selectionMode === "multiple" || allowMultiple) && (
            <Button
              onClick={handleConfirmSelection}
              disabled={selectedMedia.length === 0}
            >
              Select {selectedMedia.length > 0 ? `${selectedMedia.length} ` : ""}
              {selectedMedia.length === 1 ? "Item" : "Items"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

