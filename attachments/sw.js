// Service worker for جدول عبدالله — Web Push receiver.
//
// This file must be served from the ROOT of the site (same directory as index.html),
// i.e. https://ashafei1905com.github.io/My-schedule/sw.js — a service worker's scope
// is limited to its own directory and below, so it cannot live in a subfolder if it
// needs to control the whole site.
//
// This replaces the old client-side setTimeout reminder system. The 'push' event
// below fires from the OS/browser's push service — Cloudflare's Worker cron sends the
// actual push message; this file only has to receive and DISPLAY it. That is what
// makes it work even when the PWA/tab is fully closed: the browser's push service
// wakes this service worker up in response to an incoming push, independent of
// whether any tab is open.

self.addEventListener('install', (event) => {
  // Activate this version immediately rather than waiting for old tabs to close —
  // reminder delivery should never be delayed by a stale SW version hanging around.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: '🔔 جدول عبدالله', body: 'عندك تذكير جديد' };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (e) {
    // Payload wasn't valid JSON — fall back to the generic default above rather than
    // throwing and dropping the notification entirely.
    console.warn('push payload parse failed', e);
  }

  const options = {
    body: data.body,
    // Simple emoji-based icon, consistent with the existing in-app notification icons
    // (scheduleTodayNotifications used the same data-URI SVG-emoji pattern).
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y="75" font-size="80"%3E%F0%9F%8F%8B%EF%B8%8F%3C/text%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y="75" font-size="80"%3E%F0%9F%94%94%3C/text%3E%3C/svg%3E',
    tag: data.tag || 'schedule-reminder',
    dir: 'rtl',
    lang: 'ar',
    data: { url: '/My-schedule/' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Tapping the notification focuses an already-open tab if one exists, otherwise opens
// a new one — standard PWA notification-click pattern.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/My-schedule/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('My-schedule') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
