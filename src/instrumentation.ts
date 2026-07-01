/**
 * Next.js instrumentation. `register()` runs once at server startup — it's the
 * place to wire an error-tracking SDK into the logger's reporter seam.
 * `onRequestError` captures otherwise-unhandled server errors (RSC, route
 * handlers, server actions) and logs them structurally.
 */
import { logger } from "@/lib/logger";

export function register(): void {
  // To enable Sentry (or similar), install it and uncomment:
  //   import * as Sentry from "@sentry/nextjs";
  //   import { setErrorReporter } from "@/lib/logger";
  //   setErrorReporter((err, context) => Sentry.captureException(err, { extra: context }));
  logger.info("server started", { env: process.env.NODE_ENV });
}

export function onRequestError(
  err: unknown,
  request: { path?: string; method?: string },
  context: { routerKind?: string; routePath?: string; routeType?: string },
): void {
  logger.error("unhandled server error", {
    err,
    path: request.path,
    method: request.method,
    routeType: context.routeType,
    routePath: context.routePath,
  });
}
