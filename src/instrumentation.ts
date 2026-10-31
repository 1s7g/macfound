import type { Instrumentation } from "next";

/**
 * Report server errors as they happen.
 *
 * Next calls onRequestError for anything thrown while rendering a page, running
 * a server action or handling a route. Each distinct error (route plus message)
 * alerts at most once per half hour — see lib/alerts.ts.
 *
 * Errors the app catches and explains to the user itself — a sign-in email
 * that Resend refused, for one — never reach this hook, so those places call
 * sendAlert directly.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  // The alert path uses Node APIs (the database client, Resend); skip the edge
  // runtime, where none of this app's routes run anyway.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { describeError, sendAlert } = await import("@/lib/alerts");
  const message = describeError(error);
  const path = request.path.split("?")[0];

  await sendAlert(
    `Server error on ${request.method} ${path}`,
    [message, `Route: ${context.routePath} (${context.routeType})`].join("\n"),
    `request:${context.routePath}:${message.slice(0, 80)}`,
  );
};
