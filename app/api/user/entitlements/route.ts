/**
 * Get User Entitlements API
 * 
 * Returns user's current plan and entitlements (Veo Pro access, etc.)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserEntitlements } from "@/lib/billing/get-user-entitlements";

// Mark as dynamic route since we use request.headers
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(request.headers);
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const entitlements = await getUserEntitlements(auth.user.id);

    return NextResponse.json({
      success: true,
      entitlements,
    });
  } catch (error) {
    console.error("[user/entitlements] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch entitlements",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

