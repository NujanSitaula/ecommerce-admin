import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL, AUTH_COOKIE_NAME } from "@/lib/config";

async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(AUTH_COOKIE_NAME);
  return cookie?.value;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = `${API_BASE_URL}/api/admin/orders/${id}/invoice`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || "Failed to download invoice" },
        { status: response.status }
      );
    }

    const pdf = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "application/pdf";
    const contentDisposition =
      response.headers.get("content-disposition") ||
      `attachment; filename="invoice-${id}.pdf"`;

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (error) {
    console.error("Invoice download API error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Unable to download invoice",
      },
      { status: 500 }
    );
  }
}
