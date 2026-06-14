"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Customer details are now collected in the Trip Information step at the start
 * of the journey. This route is kept as a redirect so any stale links resolve.
 */
export default function DetailsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/journey");
  }, [router]);
  return null;
}
