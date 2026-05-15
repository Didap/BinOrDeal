import { headers } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { db } from "@/db/client"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get("Stripe-Signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    )
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session

  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    )

    if (!session?.metadata?.userId) {
      return new NextResponse("User id is required", { status: 400 })
    }

    // Upgrade user to Pro
    await db.update(users)
      .set({
        tier: "pro",
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscription.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.metadata.userId))

    console.log(`✅ User ${session.metadata.userId} upgraded to PRO`)
  }

  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    )

    // Ensure user remains Pro on successful renewal
    // (Optional, mostly for logging/assurance)
    if (session?.metadata?.userId) {
      await db.update(users)
        .set({
          tier: "pro",
          stripeSubscriptionId: subscription.id,
          updatedAt: new Date(),
        })
        .where(eq(users.id, session.metadata.userId))
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription
    
    // Downgrade user back to Free
    await db.update(users)
      .set({
        tier: "free",
        stripeSubscriptionId: null,
        updatedAt: new Date(),
      })
      .where(eq(users.stripeSubscriptionId, subscription.id))
      
    console.log(`❌ Subscription ${subscription.id} deleted. User downgraded.`)
  }

  return new NextResponse(null, { status: 200 })
}
