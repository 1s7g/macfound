"use client";

/**
 * Last-resort boundary, for errors thrown by the root layout itself.
 *
 * This replaces the layout rather than rendering inside it, so it has to supply
 * its own <html> and <body> — and it can't rely on the design tokens, since the
 * thing that failed may be what loads them. Hence the inline styles and the
 * plain colours: this page's only job is to be legible when everything else has
 * gone wrong. It uses system dark/light rather than the app's theme for the
 * same reason.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "Canvas",
          color: "CanvasText",
          colorScheme: "light dark",
        }}
      >
        <div style={{ maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
            MacFound couldn&rsquo;t load
          </h1>
          <p style={{ marginTop: "0.5rem", lineHeight: 1.6, opacity: 0.75 }}>
            Something failed before the page could start. Reloading usually
            clears it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.625rem 1rem",
              borderRadius: "0.625rem",
              border: 0,
              background: "#7A003C",
              color: "#fff",
              font: "inherit",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ marginTop: "2rem", fontSize: "0.75rem", opacity: 0.6 }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
