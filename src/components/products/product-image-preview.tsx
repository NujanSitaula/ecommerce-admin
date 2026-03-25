"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

interface ProductImagePreviewProps {
  thumbnailUrl?: string;
  originalUrl?: string;
  gallery?: string[];
  alt: string;
}

export function ProductImagePreview({
  thumbnailUrl,
  originalUrl,
  gallery,
  alt,
}: ProductImagePreviewProps) {
  const [imageError, setImageError] = useState(false);

  const imageUrl = thumbnailUrl || originalUrl || (gallery && gallery.length > 0 ? gallery[0] : null);

  if (!imageUrl || imageError) {
    return (
      <div className="w-16 h-16 rounded-md border bg-muted flex items-center justify-center">
        <ImageIcon className="w-6 h-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative w-16 h-16 rounded-md overflow-hidden border bg-muted">
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

