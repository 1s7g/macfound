import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MacFound · Lost & found for McMaster",
    template: "%s",
  },
  description:
    "Report lost items and post found ones at McMaster University. Sign in with your McMaster email.",
};

/*
 * Resolve the theme before the first paint.
 *
 * This has to run synchronously in <head>: anything deferred (a useEffect, a
 * normal module) paints the default theme first, so a dark-mode visitor gets a
 * white flash on every navigation. Reading localStorage is cheap enough to be
 * worth blocking on. With no stored choice it falls back to the system
 * preference, which keeps "follow the OS" as the default behaviour.
 */
const themeScript = `(function(){try{var s=localStorage.getItem("theme");document.documentElement.dataset.theme=s==="light"||s==="dark"?s:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The script below adds data-theme before React hydrates, which the server
    // HTML can't include — suppress the resulting <html> attribute mismatch.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* next/script rather than a bare <script>: React warns that script
            elements rendered as components don't execute, and beforeInteractive
            is the supported way to get code into the document ahead of
            hydration. Only the first document load needs it — client-side
            navigations keep the DOM, and the attribute with it. */}
        <Script id="theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
