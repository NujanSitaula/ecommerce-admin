"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Crop,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  RefreshCw,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactCrop, {
  Crop as ReactCropType,
  PixelCrop,
  makeAspectCrop,
  centerCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  loadImage,
  applyAdjustments,
  applyFilterPreset,
  drawImageWithTransform,
  resizeImage,
  canvasToBlob,
  getImageMimeType,
  type ImageAdjustments,
  type FilterPreset,
  type ImageTransform,
} from "@/lib/image-processing";

interface ImageEditorProps {
  imageUrl: string;
  imageName: string;
  initialAltText?: string;
  initialDescription?: string;
  onSave: (editedImageBlob: Blob, filename: string, metadata?: { altText?: string; description?: string }) => void;
  onClose: () => void;
  open: boolean;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function ImageEditor({
  imageUrl,
  imageName,
  initialAltText = "",
  initialDescription = "",
  onSave,
  onClose,
  open,
}: ImageEditorProps) {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [imgRef, setImgRef] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<ReactCropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [showCrop, setShowCrop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"adjust" | "filters" | "transform" | "resize" | "metadata">("metadata");
  const [altText, setAltText] = useState("");
  const [description, setDescription] = useState("");

  // Editor state
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
  });
  const [filter, setFilter] = useState<FilterPreset>("none");
  const [transform, setTransform] = useState<ImageTransform>({
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
  });
  const [resizeDimensions, setResizeDimensions] = useState<{
    width: number;
    height: number;
    maintainAspect: boolean;
  }>({
    width: 0,
    height: 0,
    maintainAspect: true,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load original image and initialize metadata
  useEffect(() => {
    if (open && imageUrl) {
      setOriginalImage(null); // Reset when opening
      setAltText(initialAltText);
      setDescription(initialDescription);
      loadImage(imageUrl)
        .then((img) => {
          setOriginalImage(img);
          setResizeDimensions({
            width: img.width,
            height: img.height,
            maintainAspect: true,
          });
        })
        .catch((error) => {
          const errorMessage = error instanceof Error ? error.message : "Failed to load image";
          console.error("Failed to load image:", errorMessage, error);
          // Error is already handled by loadImage with fallback
          // Keep originalImage as null to show loading/error state
        });
    }
  }, [open, imageUrl, initialAltText, initialDescription]);

  // Render image to canvas with all edits
  const renderCanvas = useCallback(() => {
    if (!originalImage || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const canvas = canvasRef.current;
    const { width, height } = resizeDimensions.width > 0 
      ? resizeDimensions 
      : { width: originalImage.width, height: originalImage.height };

    canvas.width = width;
    canvas.height = height;

    // Draw image with transformations
    drawImageWithTransform(ctx, originalImage, width, height, transform);

    // Apply adjustments
    applyAdjustments(ctx, width, height, adjustments);

    // Apply filter
    applyFilterPreset(ctx, width, height, filter);

    setCanvas(canvas);
  }, [originalImage, adjustments, filter, transform, resizeDimensions]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Re-render canvas when crop is canceled
  useEffect(() => {
    if (!showCrop && originalImage && canvasRef.current) {
      // Small delay to ensure canvas is mounted
      const timer = setTimeout(() => {
        renderCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showCrop, originalImage, renderCanvas]);

  const handleCropComplete = useCallback(
    async (crop: PixelCrop) => {
      if (!imgRef || !originalImage) return;

      setLoading(true);
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }

        const scaleX = originalImage.naturalWidth / originalImage.width;
        const scaleY = originalImage.naturalHeight / originalImage.height;

        canvas.width = crop.width;
        canvas.height = crop.height;

        ctx.drawImage(
          originalImage,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          crop.width,
          crop.height
        );

        // Load cropped image and update original
        const croppedDataUrl = canvas.toDataURL();
        const croppedImg = await loadImage(croppedDataUrl);
        setOriginalImage(croppedImg);
        setResizeDimensions({
          width: croppedImg.width,
          height: croppedImg.height,
          maintainAspect: true,
        });
        setShowCrop(false);
        setCrop(undefined);
        setCompletedCrop(undefined);
      } catch (error) {
        console.error("Crop error:", error);
        // Show error to user
        alert(error instanceof Error ? error.message : "Failed to crop image");
      } finally {
        setLoading(false);
      }
    },
    [imgRef, originalImage]
  );

  const handleRotate = (direction: "cw" | "ccw") => {
    setTransform((prev) => ({
      ...prev,
      rotation: prev.rotation + (direction === "cw" ? 90 : -90),
    }));
  };

  const handleFlip = (direction: "horizontal" | "vertical") => {
    setTransform((prev) => ({
      ...prev,
      flipHorizontal:
        direction === "horizontal" ? !prev.flipHorizontal : prev.flipHorizontal,
      flipVertical:
        direction === "vertical" ? !prev.flipVertical : prev.flipVertical,
    }));
  };

  const handleReset = () => {
    if (!imageUrl) return;
    loadImage(imageUrl).then((img) => {
      setOriginalImage(img);
      setAdjustments({ brightness: 0, contrast: 0, saturation: 0 });
      setFilter("none");
      setTransform({ rotation: 0, flipHorizontal: false, flipVertical: false });
      setResizeDimensions({
        width: img.width,
        height: img.height,
        maintainAspect: true,
      });
    });
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;

    setLoading(true);
    try {
      const blob = await canvasToBlob(
        canvasRef.current,
        0.9,
        getImageMimeType(imageUrl)
      );
      const filename = imageName.replace(/\.[^/.]+$/, "") + "-edited.jpg";
      await onSave(blob, filename, {
        altText: altText || undefined,
        description: description || undefined,
      });
    } catch (error) {
      console.error("Save error:", error);
      // Error is handled by parent component via toast
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleResizeWidthChange = (value: number) => {
    if (!originalImage) return;
    const newWidth = value;
    let newHeight = resizeDimensions.height;

    if (resizeDimensions.maintainAspect) {
      const aspect = originalImage.height / originalImage.width;
      newHeight = Math.round(newWidth * aspect);
    }

    setResizeDimensions({
      width: newWidth,
      height: newHeight,
      maintainAspect: resizeDimensions.maintainAspect,
    });
  };

  const handleResizeHeightChange = (value: number) => {
    if (!originalImage) return;
    let newWidth = resizeDimensions.width;
    const newHeight = value;

    if (resizeDimensions.maintainAspect) {
      const aspect = originalImage.width / originalImage.height;
      newWidth = Math.round(newHeight * aspect);
    }

    setResizeDimensions({
      width: newWidth,
      height: newHeight,
      maintainAspect: resizeDimensions.maintainAspect,
    });
  };

  if (!originalImage) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Loading Image Editor</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-muted-foreground mb-4">Loading image...</div>
            <div className="text-sm text-muted-foreground text-center max-w-md">
              If the image doesn't load, it might be due to CORS restrictions. 
              Try accessing the image directly in your browser.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="!w-[98vw] !max-w-[98vw] !h-[98vh] !max-h-[98vh] flex flex-col p-0 gap-0 overflow-hidden"
        style={{ width: '98vw', maxWidth: '98vw', height: '98vh', maxHeight: '98vh' }}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Panel - Editor Tools */}
          <div className="w-80 xl:w-96 border-r flex flex-col overflow-hidden bg-background shrink-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <TabsList className="grid grid-cols-5 gap-1 m-4 mb-0 shrink-0">
                <TabsTrigger value="metadata" className="text-xs">Meta</TabsTrigger>
                <TabsTrigger value="adjust" className="text-xs">Adjust</TabsTrigger>
                <TabsTrigger value="filters" className="text-xs">Filters</TabsTrigger>
                <TabsTrigger value="transform" className="text-xs">Transform</TabsTrigger>
                <TabsTrigger value="resize" className="text-xs">Resize</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                <TabsContent value="metadata" className="space-y-4 mt-4">
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
                </TabsContent>

                <TabsContent value="adjust" className="space-y-6 mt-4">
                  <div className="space-y-2">
                    <Label>Brightness: {adjustments.brightness}</Label>
                    <Slider
                      value={[adjustments.brightness]}
                      onValueChange={([value]) =>
                        setAdjustments((prev) => ({ ...prev, brightness: value }))
                      }
                      min={-100}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contrast: {adjustments.contrast}</Label>
                    <Slider
                      value={[adjustments.contrast]}
                      onValueChange={([value]) =>
                        setAdjustments((prev) => ({ ...prev, contrast: value }))
                      }
                      min={-100}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Saturation: {adjustments.saturation}</Label>
                    <Slider
                      value={[adjustments.saturation]}
                      onValueChange={([value]) =>
                        setAdjustments((prev) => ({ ...prev, saturation: value }))
                      }
                      min={-100}
                      max={100}
                      step={1}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="filters" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {(["none", "grayscale", "sepia", "vintage", "blackwhite", "invert"] as FilterPreset[]).map(
                      (preset) => (
                        <Button
                          key={preset}
                          variant={filter === preset ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilter(preset)}
                          className="capitalize"
                        >
                          {preset === "blackwhite" ? "Black & White" : preset}
                        </Button>
                      )
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="transform" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Rotation: {transform.rotation}°</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRotate("ccw")}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRotate("cw")}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Flip</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={transform.flipHorizontal ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFlip("horizontal")}
                      >
                        <FlipHorizontal className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={transform.flipVertical ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFlip("vertical")}
                      >
                        <FlipVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCrop(true)}
                      className="w-full"
                    >
                      <Crop className="h-4 w-4 mr-2" />
                      Crop Image
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="resize" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={resizeDimensions.maintainAspect}
                        onChange={(e) =>
                          setResizeDimensions((prev) => ({
                            ...prev,
                            maintainAspect: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <Label className="text-sm">Maintain aspect ratio</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Width: {resizeDimensions.width}px</Label>
                    <Slider
                      value={[resizeDimensions.width]}
                      onValueChange={([value]) => handleResizeWidthChange(value)}
                      min={100}
                      max={originalImage.width * 2}
                      step={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Height: {resizeDimensions.height}px</Label>
                    <Slider
                      value={[resizeDimensions.height]}
                      onValueChange={([value]) => handleResizeHeightChange(value)}
                      min={100}
                      max={originalImage.height * 2}
                      step={10}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {/* Toolbar */}
            <div className="p-4 border-t flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-[0.85] flex items-center justify-center bg-black p-6 overflow-auto min-w-0 relative">
            {/* Canvas - always rendered but hidden when cropping */}
            {originalImage && (
              <canvas
                ref={canvasRef}
                className={`max-w-full max-h-full w-auto h-auto object-contain ${showCrop ? "hidden" : ""}`}
                style={{ 
                  maxWidth: "100%",
                  maxHeight: "calc(98vh - 200px)",
                }}
              />
            )}
            
            {/* Crop interface - shown when showCrop is true */}
            {showCrop && originalImage && (
              <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black">
                <div className="flex-1 flex items-center justify-center w-full overflow-auto">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    className="w-full h-full"
                  >
                    <img
                      ref={setImgRef}
                      src={originalImage.src}
                      alt="Crop"
                      className="max-w-full max-h-full w-auto h-auto object-contain"
                      style={{ maxHeight: "calc(98vh - 200px)", maxWidth: "100%" }}
                      onLoad={(e) => {
                        const { width, height } = e.currentTarget;
                        setCrop(centerAspectCrop(width, height, 1));
                      }}
                    />
                  </ReactCrop>
                </div>
                <div className="flex gap-2 mt-4 justify-center shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCrop(false);
                      setCrop(undefined);
                      setCompletedCrop(undefined);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => completedCrop && handleCropComplete(completedCrop)}
                    disabled={!completedCrop || loading}
                  >
                    Apply Crop
                  </Button>
                </div>
              </div>
            )}
            
            {/* Loading state */}
            {!originalImage && (
              <div className="flex items-center justify-center text-muted-foreground">
                Loading image...
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save as New Version"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

