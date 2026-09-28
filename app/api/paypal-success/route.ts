import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id");
    const subscriptionId = req.nextUrl.searchParams.get("subscription_id");

    if (!userId || !subscriptionId) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("user_plans").upsert(
      {
        user_id: userId,
        plan: "premium",
        paypal_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    return NextResponse.redirect(new URL("/dashboard?upgraded=true", req.nextUrl.origin));
  } catch (error) {
    console.error("PayPal success handler error:", error);
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
}