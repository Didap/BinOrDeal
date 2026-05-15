import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  // We don't throw here to avoid crashing the build if keys are missing initially,
  // but we should log a warning in development.
  if (process.env.NODE_ENV === "development") {
    console.warn("⚠️ STRIPE_SECRET_KEY is missing from .env")
  }
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-04-22.dahlia", // Use a stable version
  typescript: true,
})

export const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
