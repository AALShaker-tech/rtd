"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Verification was folded into the customer details page. This route is kept
 * as a redirect so any stale links resolve gracefully.
 */
export default function VerifyRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/journey/details");
  }, [router]);
  return null;
}
