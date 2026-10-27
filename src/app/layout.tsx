import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

// viewport-fit=cover lets the phone tab bar reach the bottom edge and pad itself
// clear of the home indicator with env(safe-area-inset-bottom), rather than the
// browser leaving a blank strip under it.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Every page puts the wordmark, board switch and header controls
            ahead of its content, which a keyboard or screen-reader user would
            otherwise tab through on every single navigation. Visible only once
            focused. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-on-brand"
        >
          Skip to content
        </a>

        {children}
      </body>
    </html>
  );
}
