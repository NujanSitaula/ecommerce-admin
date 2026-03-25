import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, AUTH_COOKIE_NAME } from "@/lib/config";

async function getAuthToken(request: NextRequest): Promise<string | undefined> {
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  return cookie?.value;
}

export async function POST(
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

    const response = await fetch(`${API_BASE_URL}/api/admin/media/${id}/edit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: (error as { message?: string }).message || "Failed to save edited image" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Media edit API error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to save edited image",
      },
      { status: 500 },
    );
  }
}

