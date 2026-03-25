"use client";

import type { Media, MediaListParams, Paginated } from "./types";

export interface MediaListResponse extends Paginated<Media> {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/**
 * Client-side fetch helper for authenticated requests
 */
async function clientFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Ensure we're in the browser
  if (typeof window === "undefined") {
    throw new Error("clientFetch can only be called from the browser");
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { message?: string }).message || `Request failed with status ${response.status}`
    );
  }

  return response.json();
}

/**
 * List media with pagination and filters
 */
export async function listMedia(
  params?: MediaListParams
): Promise<MediaListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params?.type) {
    searchParams.append("type", params.type);
  }
  if (params?.search) {
    searchParams.append("search", params.search);
  }
  if (params?.page) {
    searchParams.append("page", params.page.toString());
  }
  if (params?.per_page) {
    searchParams.append("per_page", params.per_page.toString());
  }
  if (params?.sort_by) {
    searchParams.append("sort_by", params.sort_by);
  }
  if (params?.sort_order) {
    searchParams.append("sort_order", params.sort_order);
  }

  const queryString = searchParams.toString();
  const url = `/api/admin/media${queryString ? `?${queryString}` : ""}`;

  return clientFetch<MediaListResponse>(url, {
    method: "GET",
  });
}

/**
 * Get single media item
 */
export async function getMedia(id: number): Promise<Media> {
  return clientFetch<Media>(`/api/admin/media/${id}`, {
    method: "GET",
  });
}

/**
 * Upload media files
 */
export async function uploadMedia(files: File[]): Promise<{ data: Media[] }> {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append("files[]", file);
  });

  return clientFetch<{ data: Media[] }>("/api/admin/media", {
    method: "POST",
    body: formData,
  });
}

/**
 * Update media metadata
 */
export async function updateMedia(
  id: number,
  data: { alt_text?: string; description?: string; thumbnail?: File }
): Promise<Media> {
  const formData = new FormData();
  
  if (data.alt_text !== undefined) {
    formData.append("alt_text", data.alt_text);
  }
  if (data.description !== undefined) {
    formData.append("description", data.description);
  }
  if (data.thumbnail) {
    formData.append("thumbnail", data.thumbnail);
  }

  return clientFetch<Media>(`/api/admin/media/${id}`, {
    method: "PUT",
    body: formData,
  });
}

/**
 * Delete media item
 */
export async function deleteMedia(id: number): Promise<{ message: string }> {
  return clientFetch<{ message: string }>(`/api/admin/media/${id}`, {
    method: "DELETE",
  });
}

/**
 * Save edited image as new version
 */
export async function saveEditedImage(
  originalId: number,
  editedImageFile: File,
  filename: string
): Promise<Media> {
  const formData = new FormData();
  formData.append("file", editedImageFile);
  formData.append("filename", filename);

  const response = await fetch(`/api/admin/media/${originalId}/edit`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = (error as { message?: string }).message || errorMessage;
    } catch {
      // If JSON parsing fails, use default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format duration for videos
 */
export function formatDuration(seconds?: number): string {
  if (!seconds) return "";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

