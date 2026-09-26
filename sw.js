// Service worker for الجدول الذكي — Web Push receiver (works with app fully closed).
//
// Cloudflare Worker cron sends pushes; this file only displays them. That is what
// keeps reminders alive after the user stops using the app.

function urlBase64ToUint8Array(base64String){
  const padding='='.repeat((4-base64String.length%4)%4);
  const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
  const rawData=atob(base64);
  const outputArray=new Uint8Array(rawData.length);
  for(let i=0;i<rawData.length;i++) outputArray[i]=rawData.charCodeAt(i);
  return outputArray;
}

const VAPID_PUBLIC_KEY = 'BKgn0lwYCrrfdSIX6PSaaR34nEO1g9FkZ9V3mlZmBAWY_fE7LcbI4osZ9CP8tQsfU1R5vLbg4S0GhNL3QiIOSnQ';
const WORKER_URL = 'https://falling-frost-7656.ashafei1905.workers.dev';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: '🔔 Your Schedule', body: 'You have a reminder' };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (e) {
    console.warn('push payload parse failed', e);
  }

  const options = {
    body: data.body,
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y="75" font-size="80"%3E%F0%9F%8F%8B%EF%B8%8F%3C/text%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y="75" font-size="80"%3E%F0%9F%94%94%3C/text%3E%3C/svg%3E',
    tag: data.tag || 'schedule-reminder',
    dir: 'auto',
    lang: 'en',
    requireInteraction: false,
    data: { url: (data.data && data.data.url) || './' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Browser rotated/invalidated the push subscription (can happen after long inactivity)
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    try {
      const newSub = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      // Re-register subscription with the Worker. Empty reminders is OK —
      // the next app open will re-upload the full 30-day schedule.
      await fetch(WORKER_URL + '/api/save-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: 'auto_renewed',
          subscription: newSub.toJSON(),
          reminders: []
        })
      });
    } catch (err) {
      console.warn('pushsubscriptionchange renewal failed:', err);
    }
  })());
});

// Periodic background sync (Chrome/Android) — asks open clients to re-upload schedules
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-reminders') {
    event.waitUntil((async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        try { client.postMessage({ type: 'SYNC_REMINDERS' }); } catch (e) {}
      }
    })());
  }
});

self.addEventListener('message', (event) => {
  // Reserved for future client↔SW commands
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && (client.url.includes('My-schedule') || client.url.includes('schedule')) && 'focus' in client) {
          return client.focus();
        }
      }
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
