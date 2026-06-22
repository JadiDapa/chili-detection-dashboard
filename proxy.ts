import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Auth pages (sign-in / sign-up) — logged-in users must never land here
const isAuthPage = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

// Routes that must stay reachable while signed out:
//  - auth pages themselves
//  - API/trpc routes (RPi posts here with no Clerk session)
//  - Clerk's own frontend-API handshake routes
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api(.*)",
  "/trpc(.*)",
  "/__clerk(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { isAuthenticated, redirectToSignIn } = await auth();

  // Already signed in → bounce away from auth pages before the page renders.
  // Done in middleware (not just the page) so soft client-side navigations
  // don't serve a cached auth page that skips the redirect.
  if (isAuthenticated && isAuthPage(req)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Signed out → protect every page route. redirectToSignIn() preserves the
  // return-to URL so the user lands back where they intended after signing in.
  if (!isAuthenticated && !isPublicRoute(req)) {
    return redirectToSignIn();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific frontend API routes
    "/__clerk/(.*)",
  ],
};
