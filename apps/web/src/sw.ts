/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare let self: ServiceWorkerGlobalScope;

// Take over control immediately
self.skipWaiting();
clientsClaim();

// Precache compiled assets
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// Background Sync for Journal API requests
const bgSyncPlugin = new BackgroundSyncPlugin('journal-sync-queue', {
  maxRetentionTime: 24 * 60, // Retry for max of 24 Hours (specified in minutes)
});

// Cache standard API requests (fallback to cache if offline)
registerRoute(
  /\/api\/v1\/(calendar|sessions)/i,
  new NetworkFirst({
    cacheName: 'api-readonly-cache',
    networkTimeoutSeconds: 5,
  })
);

// Use background sync for journal mutations (POST/PATCH)
registerRoute(
  /\/api\/v1\/journal/i,
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

registerRoute(
  /\/api\/v1\/journal\/.*/i,
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'PATCH'
);

// Fallback for polygon API
registerRoute(
  /^https:\/\/api\.polygon\.io\/.*/i,
  new NetworkFirst({
    cacheName: 'polygon-api-cache',
  })
);
