import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/config";

export async function GET() {
  try {
    const url = `${API_BASE_URL}/api/countries`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to fetch countries" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Countries API error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to fetch countries",
      },
      { status: 500 }
    );
  }
}
