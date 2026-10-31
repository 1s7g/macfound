import type { MetadataRoute } from "next";

/**
 * Lets "Add to Home Screen" install MacFound like an app: its own name and
 * icon, opening straight onto the board without browser chrome. Most students
 * use this on a phone, so this is the closest thing to an app-store listing.
 *
 * The maskable icon is full-bleed, with the pin inside the central safe zone,
 * because Android crops it to whatever shape the launcher uses.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MacFound",
    short_name: "MacFound",
    description: "Lost & found for McMaster students.",
    start_url: "/browse",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#faf9f7",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
