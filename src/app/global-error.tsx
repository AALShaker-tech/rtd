"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

/**
 * Root error boundary. Catches errors thrown while rendering the root layout and
 * logs them (which also forwards to the error reporter). It must render its own
 * <html>/<body> because it replaces the root layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("client render error", { err: error, digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a1a",
          color: "#f5f0e8",
          fontFamily: "system-ui, sans-serif",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ opacity: 0.6, marginTop: "0.5rem" }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.6rem 1.5rem",
              borderRadius: "0.5rem",
              border: "1px solid #c9a24b",
              background: "transparent",
              color: "#c9a24b",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
