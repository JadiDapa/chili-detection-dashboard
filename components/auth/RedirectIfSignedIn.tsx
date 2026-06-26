"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Client-side guard for the auth pages: bounces signed-in users back to "/".
// The server-side redirect only fires on full loads (refresh); soft client-side
// navigations and the Back button can serve a cached RSC payload that skips it.
export default function RedirectIfSignedIn() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace("/");
  }, [isLoaded, isSignedIn, router]);

  return null;
}
