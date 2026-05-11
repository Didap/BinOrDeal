import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export default clerkMiddleware((auth, req) => {
  const res = NextResponse.next()
  
  // Ensure session ID for anonymous tracking
  if (!req.cookies.has("bid_session_id")) {
    res.cookies.set("bid_session_id", crypto.randomUUID(), {
      maxAge: 60 * 60 * 24, // 24h
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    })
  }
  
  return res
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
