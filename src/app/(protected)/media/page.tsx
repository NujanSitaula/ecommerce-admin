"use client";

import { useState, useRef } from "react";
import { Upload, Trash2, Edit2, Image as ImageIcon, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaGallery } from "@/components/media/media-gallery";
import { MediaUpload } from "@/components/media/media-upload";
import { ImageEditor } from "@/components/media/image-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteMedia, updateMedia, saveEditedImage, formatFileSize, formatDuration } from "@/lib/media";
import type { Media } from "@/lib/types";
import { toast } from "sonner";

export default function MediaLibraryPage() {
  const [activeTab, setActiveTab] = useState<"gallery" | "upload">("gallery");
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [altText, setAltText] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handlePreview = (media: Media) => {
    setPreviewMedia(media);
    setPreviewDialogOpen(true);
  };

  const handleEditFromPreview = () => {
    if (!previewMedia) return;
    if (previewMedia.file_type === "image") {
      setEditingMedia(previewMedia);
      setPreviewDialogOpen(false);
      setEditorOpen(true);
    } else {
      setSelectedMedia(previewMedia);
      setEditingMedia(previewMedia);
      setAltText(previewMedia.alt_text || "");
      setDescription(previewMedia.description || "");
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setPreviewDialogOpen(false);
      setEditDialogOpen(true);
    }
  };

  const handleSaveEditedImage = async (
    blob: Blob,
    filename: string,
    metadata?: { altText?: string; description?: string }
  ) => {
    const media = editingMedia || previewMedia;
    if (!media) return;

    setSaving(true);
    try {
      const file = new File([blob], filename, { type: blob.type });
      const newMedia = await saveEditedImage(media.id, file, filename);
      
      // Update metadata if provided
      if (metadata && (metadata.altText || metadata.description)) {
        await updateMedia(newMedia.id, {
          alt_text: metadata.altText,
          description: metadata.description,
        });
      }
      
      toast.success("Edited image saved successfully");
      setEditorOpen(false);
      setEditDialogOpen(false);
      setPreviewDialogOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save edited image"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFromPreview = () => {
    if (!previewMedia) return;
    setSelectedMedia(previewMedia);
    setPreviewDialogOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleMediaClick = (media: Media) => {
    setSelectedMedia(media);
    if (media.file_type === "image") {
      setEditingMedia(media);
      setEditorOpen(true);
    } else {
      setEditDialogOpen(true);
      setEditingMedia(media);
      setAltText(media.alt_text || "");
      setDescription(media.description || "");
      setThumbnailFile(null);
      setThumbnailPreview(null);
    }
  };

  const handleSave = async () => {
    if (!editingMedia) return;

    setSaving(true);
    try {
      await updateMedia(editingMedia.id, {
        alt_text: altText,
        description: description,
        thumbnail: thumbnailFile || undefined,
      });
      toast.success("Media updated successfully");
      setEditDialogOpen(false);
      setEditingMedia(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      // Refresh gallery by changing key or using a refetch mechanism
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update media"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async () => {
    if (!selectedMedia) return;

    setDeleting(true);
    try {
      await deleteMedia(selectedMedia.id);
      toast.success("Media deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedMedia(null);
      // Refresh gallery
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete media"
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadComplete = () => {
    setActiveTab("gallery");
    // Refresh gallery
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Media Library</h1>
          <p className="text-sm text-muted-foreground">
            Manage and organize your media files
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Media Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "gallery" | "upload")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="gallery">Media Library</TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload New
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gallery" className="mt-4">
              <MediaGallery
                selectionMode="single"
                onPreview={handlePreview}
              />
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <MediaUpload onUploadComplete={handleUploadComplete} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>{previewMedia?.name || "Preview Media"}</DialogTitle>
          </DialogHeader>

          {previewMedia && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Media Preview */}
              <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center min-h-0">
                {previewMedia.file_type === "image" ? (
                  <img
                    src={previewMedia.url}
                    alt={previewMedia.alt_text || previewMedia.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : previewMedia.file_type === "video" ? (
                  <video
                    src={previewMedia.url}
                    controls
                    className="max-w-full max-h-full"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                    <FileIcon className="h-16 w-16 mb-4" />
                    <p className="text-lg font-medium">{previewMedia.name}</p>
                    <p className="text-sm mt-2">
                      {formatFileSize(previewMedia.file_size)}
                    </p>
                  </div>
                )}
              </div>

              {/* Media Info */}
              <div className="px-6 py-4 border-t bg-muted/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                  <div className="min-w-0 space-y-1">
                    <Label className="text-xs text-muted-foreground block">File Name</Label>
                    <p className="text-sm font-medium break-words" title={previewMedia.name}>
                      {previewMedia.name}
                    </p>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <Label className="text-xs text-muted-foreground block">Type</Label>
                    <p className="text-sm capitalize">{previewMedia.file_type}</p>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <Label className="text-xs text-muted-foreground block">Size</Label>
                    <p className="text-sm">{formatFileSize(previewMedia.file_size)}</p>
                  </div>
                  {previewMedia.file_type === "video" && previewMedia.duration ? (
                    <div className="min-w-0 space-y-1">
                      <Label className="text-xs text-muted-foreground block">Duration</Label>
                      <p className="text-sm">{formatDuration(previewMedia.duration)}</p>
                    </div>
                  ) : previewMedia.width && previewMedia.height ? (
                    <div className="min-w-0 space-y-1">
                      <Label className="text-xs text-muted-foreground block">Dimensions</Label>
                      <p className="text-sm">
                        {previewMedia.width} × {previewMedia.height}
                      </p>
                    </div>
                  ) : null}
                </div>
                {(previewMedia.alt_text || previewMedia.description) && (
                  <div className="mt-4 space-y-2">
                    {previewMedia.alt_text && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Alt Text</Label>
                        <p className="text-sm mt-1">{previewMedia.alt_text}</p>
                      </div>
                    )}
                    {previewMedia.description && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <p className="text-sm mt-1">{previewMedia.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="px-6 py-4 border-t">
            <Button
              variant="destructive"
              onClick={handleDeleteFromPreview}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleEditFromPreview}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Editor */}
      {(editingMedia?.file_type === "image" || previewMedia?.file_type === "image") && (
        <ImageEditor
          imageUrl={(editingMedia || previewMedia)?.url || ""}
          imageName={(editingMedia || previewMedia)?.name || ""}
          initialAltText={(editingMedia || previewMedia)?.alt_text || ""}
          initialDescription={(editingMedia || previewMedia)?.description || ""}
          onSave={handleSaveEditedImage}
          onClose={() => {
            setEditorOpen(false);
            setEditDialogOpen(false);
            setPreviewDialogOpen(false);
          }}
          open={editorOpen}
        />
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
          </DialogHeader>

          {editingMedia && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-32 h-32 flex-shrink-0 bg-muted rounded overflow-hidden relative group">
                  {editingMedia.file_type === "image" ? (
                    <img
                      src={editingMedia.thumbnail_url || editingMedia.url}
                      alt={editingMedia.alt_text || editingMedia.name}
                      className="w-full h-full object-cover"
                    />
                  ) : editingMedia.file_type === "video" ? (
                    <>
                      {thumbnailPreview ? (
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                      ) : editingMedia.thumbnail_url ? (
                        <img
                          src={editingMedia.thumbnail_url}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <div className="text-muted-foreground text-xs text-center p-2">
                            No thumbnail
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => thumbnailInputRef.current?.click()}
                          className="text-xs"
                        >
                          <ImageIcon className="h-3 w-3 mr-1" />
                          {editingMedia.thumbnail_url ? "Change" : "Add"} Thumbnail
                        </Button>
                      </div>
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        className="hidden"
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-muted-foreground">Document</div>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">File Name</Label>
                    <p className="text-sm font-medium">{editingMedia.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <p className="text-sm capitalize">{editingMedia.file_type}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Size</Label>
                    <p className="text-sm">
                      {(editingMedia.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alt-text">Alt Text</Label>
                <Input
                  id="alt-text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Enter alt text for accessibility"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(true);
                setEditDialogOpen(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            {editingMedia?.file_type === "image" ? (
              <Button
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditorOpen(true);
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Image
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Media</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this media file? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

