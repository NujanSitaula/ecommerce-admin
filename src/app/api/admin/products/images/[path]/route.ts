import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { API_BASE_URL } from "@/lib/config";
import { AUTH_COOKIE_NAME } from "@/lib/config";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string } }
) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decodedPath = decodeURIComponent(params.path);

    const response = await fetch(
      `${API_BASE_URL}/api/admin/products/images/${encodeURIComponent(decodedPath)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to delete image" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete image" },
      { status: 500 }
    );
  }
}

