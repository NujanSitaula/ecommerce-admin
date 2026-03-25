import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, AUTH_COOKIE_NAME } from "@/lib/config";

async function getAuthToken(request: NextRequest): Promise<string | undefined> {
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  return cookie?.value;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid media ID" },
        { status: 400 },
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/media/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: (error as { message?: string }).message || "Failed to fetch media" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Media API error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to load media",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid media ID" },
        { status: 400 },
      );
    }

    const formData = await request.formData();

    const response = await fetch(`${API_BASE_URL}/api/admin/media/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: (error as { message?: string }).message || "Failed to update media" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Media update error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to update media",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid media ID" },
        { status: 400 },
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/media/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: (error as { message?: string }).message || "Failed to delete media" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Media delete error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to delete media",
      },
      { status: 400 },
    );
  }
}

