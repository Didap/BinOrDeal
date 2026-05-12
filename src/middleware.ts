import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  // Update Supabase session
  const res = await updateSession(request)
  
  // Ensure session ID for anonymous tracking (on top of Supabase response)
  if (!request.cookies.has("bid_session_id")) {
    res.cookies.set("bid_session_id", crypto.randomUUID(), {
      maxAge: 60 * 60 * 24, // 24h
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    })
  }
  
  return res
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
