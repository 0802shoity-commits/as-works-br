import { NextRequest, NextResponse } from "next/server";

const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const customers = await stripe.customers.list({ 
      email: email,
      limit: 1,
    });
    
    if (customers.data.length === 0) {
      return NextResponse.json({ error: 'No billing history' }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${req.nextUrl.origin}/reservations`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Billing portal error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}