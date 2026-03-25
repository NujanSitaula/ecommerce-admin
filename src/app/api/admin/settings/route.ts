import { NextResponse } from "next/server";
import { getStoreSettings, updateStoreSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getStoreSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to load settings",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const payload = await request.json().catch(() => ({}));
  try {
    const settings = await updateStoreSettings(payload);
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to update settings",
      },
      { status: 400 },
    );
  }
}

