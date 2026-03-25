"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { uploadMedia } from "@/lib/media";
import type { Media } from "@/lib/types";
import { toast } from "sonner";

interface MediaUploadProps {
  onUploadComplete?: (media: Media[]) => void;
  maxFiles?: number;
  accept?: Record<string, string[]>;
}

export function MediaUpload({
  onUploadComplete,
  maxFiles = 20,
  accept = {
    "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
    "video/*": [".mp4", ".webm", ".ogg", ".mov"],
  },
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Media[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (files.length + acceptedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, [files.length, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: true,
    maxFiles,
  });

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadMedia(files);
      setUploadedFiles(result.data);
      setFiles([]);
      toast.success(`Successfully uploaded ${result.data.length} file(s)`);
      onUploadComplete?.(result.data);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload files"
      );
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setUploadedFiles([]);
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">
          {isDragActive ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          or click to select files
        </p>
        <p className="text-xs text-muted-foreground">
          Images (JPEG, PNG, WebP, GIF) and Videos (MP4, WebM, OGG, MOV)
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Maximum {maxFiles} files
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {files.length} file(s) selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All
              </Button>
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {files.length} file(s)
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {files.map((file, index) => (
              <Card key={index} className="relative p-2">
                <div className="aspect-square relative bg-muted rounded overflow-hidden mb-2">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : file.type.startsWith("video/") ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <video
                        src={URL.createObjectURL(file)}
                        className="max-w-full max-h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">
                        {file.type}
                      </p>
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{uploadedFiles.length} file(s) uploaded successfully</span>
          </div>
        </div>
      )}
    </div>
  );
}

