import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, AUTH_COOKIE_NAME } from "@/lib/config";

async function getAuthToken(request: NextRequest): Promise<string | undefined> {
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  return cookie?.value;
}

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { message: "Missing image URL parameter" },
        { status: 400 }
      );
    }

    // Parse the image URL
    let fetchUrl = imageUrl;
    
    // If it's a backend URL, use it directly; otherwise construct full URL
    try {
      const urlObj = new URL(imageUrl);
      // If it's already a full URL, use it
      fetchUrl = urlObj.href;
    } catch {
      // If it's a relative URL, prepend API_BASE_URL
      fetchUrl = `${API_BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
    }

    // Fetch the image from the backend
    const response = await fetch(fetchUrl, {
      headers: {
        // Only add auth header if it's a backend URL
        ...(fetchUrl.includes(API_BASE_URL) ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to fetch image" },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Return the image - since it's proxied through Next.js, it's now same-origin
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to proxy image",
      },
      { status: 500 }
    );
  }
}

