import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const planId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID;

    if (!clientId || !clientSecret || !planId) {
      return NextResponse.json({ error: "PayPal設定が不完全です" }, { status: 500 });
    }

    const authRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const authData = await authRes.json();
    if (!authData.access_token) {
      console.error("PayPal auth failed:", authData);
      return NextResponse.json({ error: "PayPal認証に失敗しました" }, { status: 500 });
    }

    const origin = req.nextUrl.origin;
    const subRes = await fetch("https://api-m.paypal.com/v1/billing/subscriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: planId,
        custom_id: userId,
        application_context: {
          return_url: `${origin}/api/paypal-success?user_id=${userId}`,
          cancel_url: `${origin}/dashboard`,
          brand_name: "As-Works",
          user_action: "SUBSCRIBE_NOW",
        },
      }),
    });

    const subData = await subRes.json();
    const approveLink = subData.links?.find((l: any) => l.rel === "approve");

    if (!approveLink) {
      console.error("PayPal subscription create failed:", subData);
      return NextResponse.json({ error: "サブスクリプション作成に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ url: approveLink.href, subscriptionId: subData.id });
  } catch (error: any) {
    console.error("PayPal Checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}