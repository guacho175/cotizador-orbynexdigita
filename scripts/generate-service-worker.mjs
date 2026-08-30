import { generateSW } from "workbox-build";
import { resolve } from "node:path";

const clientOutputDirectory = resolve("dist/client");

const { count, size, warnings } = await generateSW({
  globDirectory: clientOutputDirectory,
  swDest: resolve(clientOutputDirectory, "sw.js"),
  globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
  navigateFallback: "/",
  navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//, /^\/_serverFn\//],
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "html-navigations",
        networkTimeoutSeconds: 4,
        expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
    {
      urlPattern: ({ url, request }) =>
        url.origin === self.location.origin &&
        (request.destination === "script" ||
          request.destination === "style" ||
          request.destination === "font" ||
          request.destination === "image"),
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
  ],
});

for (const warning of warnings) {
  console.warn(`[pwa] ${warning}`);
}

console.log(`[pwa] generated service worker for ${count} assets (${size} bytes)`);
