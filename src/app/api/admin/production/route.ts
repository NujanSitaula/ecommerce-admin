import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL, AUTH_COOKIE_NAME } from "@/lib/config";

async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(AUTH_COOKIE_NAME);
  return cookie?.value;
}

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Always load all orders, then filter to made-to-order items here.
    // We avoid passing production_status to the backend to keep SSR/CSR consistent.
    const url = `${API_BASE_URL}/api/admin/orders?per_page=100`;

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
        { message: errorData.message || "Failed to fetch production items" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract made-to-order items from orders
    const productionItems: any[] = [];
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((order: any) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            if (item.is_made_to_order === true) {
              productionItems.push({
                ...item,
                order: {
                  id: order.id,
                  created_at: order.created_at,
                  user: order.user,
                  guest_name: order.guest_name,
                  guest_email: order.guest_email,
                },
              });
            }
          });
        }
      });
    }

    // Log for debugging
    console.log(`Production API: Found ${productionItems.length} made-to-order items from ${data.data?.length || 0} orders`);

    return NextResponse.json({ data: productionItems });
  } catch (error) {
    console.error("Production API error:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to fetch production items",
      },
      { status: 500 }
    );
  }
}

