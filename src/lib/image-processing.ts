/**
 * Image processing utilities using HTML5 Canvas API
 */

export interface ImageAdjustments {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
}

export type FilterPreset = 
  | "none"
  | "grayscale"
  | "sepia"
  | "vintage"
  | "blackwhite"
  | "invert";

export interface ImageTransform {
  rotation: number; // degrees
  flipHorizontal: boolean;
  flipVertical: boolean;
}

/**
 * Load image from URL and return Image element
 * Proxies through Next.js API to avoid CORS issues with canvas manipulation
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    let timeoutId: NodeJS.Timeout;
    
    // Check if URL is from same origin or needs proxying
    const isSameOrigin = (() => {
      try {
        const imgUrl = new URL(url, window.location.href);
        return imgUrl.origin === window.location.origin;
      } catch {
        return false;
      }
    })();
    
    // Use proxy for cross-origin images to avoid CORS issues
    const imageSrc = isSameOrigin 
      ? url 
      : `/api/admin/media/proxy?url=${encodeURIComponent(url)}`;
    
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
    
    img.onload = () => {
      cleanup();
      resolve(img);
    };
    
    img.onerror = (error) => {
      cleanup();
      // If proxy failed, try direct URL as fallback (but canvas operations may fail)
      if (!isSameOrigin && imageSrc !== url) {
        console.warn("Proxy load failed, trying direct URL (canvas operations may be limited)...");
        const fallbackImg = new Image();
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.onerror = () => {
          const errorMessage = `Failed to load image from ${url}. This might be due to CORS restrictions, network issues, or an invalid URL.`;
          console.error(errorMessage, error);
          reject(new Error(errorMessage));
        };
        fallbackImg.src = url;
      } else {
        const errorMessage = `Failed to load image from ${url}. This might be due to CORS restrictions, network issues, or an invalid URL.`;
        console.error(errorMessage, error);
        reject(new Error(errorMessage));
      }
    };
    
    // Set src after event handlers are attached
    img.src = imageSrc;
    
    // Fallback timeout for images that never load
    timeoutId = setTimeout(() => {
      if (!img.complete) {
        reject(new Error(`Image load timeout for ${url}`));
      }
    }, 30000); // 30 second timeout
  });
}

/**
 * Apply brightness, contrast, and saturation adjustments to canvas
 */
export function applyAdjustments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  adjustments: ImageAdjustments
): void {
  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, width, height);
  } catch (error) {
    // Canvas is tainted (CORS issue) - use CSS filters as fallback
    console.warn("Canvas is tainted, using CSS filters instead of pixel manipulation");
    throw new Error("Canvas is tainted by cross-origin data. Please ensure images are loaded through the proxy.");
  }
  const data = imageData.data;

  const brightness = adjustments.brightness / 100;
  const contrast = (adjustments.contrast + 100) / 100;
  const saturation = adjustments.saturation / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply brightness
    r += brightness * 255;
    g += brightness * 255;
    b += brightness * 255;

    // Apply contrast
    r = ((r - 128) * contrast) + 128;
    g = ((g - 128) * contrast) + 128;
    b = ((b - 128) * contrast) + 128;

    // Apply saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * (1 + saturation);
    g = gray + (g - gray) * (1 + saturation);
    b = gray + (b - gray) * (1 + saturation);

    // Clamp values
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply filter preset to canvas
 */
export function applyFilterPreset(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: FilterPreset
): void {
  if (filter === "none") return;

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, width, height);
  } catch (error) {
    // Canvas is tainted (CORS issue)
    console.warn("Canvas is tainted, cannot apply filter preset");
    throw new Error("Canvas is tainted by cross-origin data. Please ensure images are loaded through the proxy.");
  }
  const data = imageData.data;

  switch (filter) {
    case "grayscale":
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      break;

    case "sepia":
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
        data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
        data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
      }
      break;

    case "vintage":
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        data[i] = Math.min(255, (r * 0.9) + (g * 0.5) + (b * 0.1));
        data[i + 1] = Math.min(255, (r * 0.7) + (g * 0.7) + (b * 0.3));
        data[i + 2] = Math.min(255, (r * 0.4) + (g * 0.4) + (b * 0.6));
      }
      break;

    case "blackwhite":
      for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const threshold = 128;
        const value = gray > threshold ? 255 : 0;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
      }
      break;

    case "invert":
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
      break;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Draw image on canvas with rotation and flip transformations
 */
export function drawImageWithTransform(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  transform: ImageTransform
): void {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Move to center
  ctx.translate(width / 2, height / 2);

  // Apply rotation
  ctx.rotate((transform.rotation * Math.PI) / 180);

  // Apply flips
  const scaleX = transform.flipHorizontal ? -1 : 1;
  const scaleY = transform.flipVertical ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  // Draw image centered
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  ctx.restore();
}

/**
 * Resize image maintaining aspect ratio
 */
export function resizeImage(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = img;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = width * ratio;
    height = height * ratio;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Export canvas as Blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number = 0.9,
  mimeType: string = "image/jpeg"
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Get MIME type from image URL or default to JPEG
 */
export function getImageMimeType(url: string): string {
  if (url.includes(".png")) return "image/png";
  if (url.includes(".webp")) return "image/webp";
  if (url.includes(".gif")) return "image/gif";
  return "image/jpeg";
}

