import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

/**
 * This machine's LAN addresses, so a phone on the same Wi-Fi can use the dev
 * server at http://<ip>:3000. Next blocks dev-only assets (the JS chunks, hot
 * reload) for any origin it wasn't started on, which left a phone with server
 * HTML and no JavaScript. Read at startup rather than hard-coded, because the
 * address changes from one network to the next. Dev-only: production ignores it.
 */
function lanAddresses(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((iface) => iface && iface.family === "IPv4" && !iface.internal)
    .map((iface) => iface!.address);
}

const nextConfig: NextConfig = {
  allowedDevOrigins: lanAddresses(),
};

export default nextConfig;
