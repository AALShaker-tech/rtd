"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Verification (and customer details) were folded into the journey builder.
 * This route is kept as a redirect so any stale links resolve gracefully —
 * straight to the builder, with no intermediate hop.
 */
export default function VerifyRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/journey");
  }, [router]);
  return null;
}
