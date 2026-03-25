import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL, AUTH_COOKIE_NAME } from "@/lib/config";

interface Params {
  params: Promise<{ id: string }>;
}

async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(AUTH_COOKIE_NAME);
  return cookie?.value;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const url = `${API_BASE_URL}/api/admin/products/${id}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: (errorData as any).message || "Not found" },
        { status: response.status },
      );
    }

    const product = await response.json();
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Not found" },
      { status: 404 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const payload = await request.json().catch(() => ({}));
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const url = `${API_BASE_URL}/api/admin/products/${id}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          message:
            (errorData as any).message || "Unable to update product",
        },
        { status: response.status },
      );
    }

    const product = await response.json();
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to update product",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const url = `${API_BASE_URL}/api/admin/products/${id}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          message:
            (errorData as any).message || "Unable to delete product",
        },
        { status: response.status },
      );
    }

    const result = await response.json().catch(() => ({}));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to delete product",
      },
      { status: 400 },
    );
  }
}

