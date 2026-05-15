import { createClient } from "@/lib/supabase/server"
import { stripe, PRO_PRICE_ID, APP_URL } from "@/lib/stripe"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (!PRO_PRICE_ID) {
      return new NextResponse("Stripe Price ID not configured", { status: 500 })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${APP_URL}/dashboard?checkout=success`,
      cancel_url: `${APP_URL}/pricing?checkout=cancel`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
      },
      // Ensure the user is created as a customer if not already
      // We'll handle linking the stripeCustomerId in the webhook
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("[STRIPE_CHECKOUT_ERROR]", error)
    return new NextResponse(error.message || "Internal Error", { status: 500 })
  }
}
