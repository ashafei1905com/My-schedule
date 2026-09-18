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

function urlBase64ToUint8Array(base64String){
  const padding='='.repeat((4-base64String.length%4)%4);
  const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
  const rawData=atob(base64);
  const outputArray=new Uint8Array(rawData.length);
  for(let i=0;i<rawData.length;i++) outputArray[i]=rawData.charCodeAt(i);
  return outputArray;
}

const VAPID_PUBLIC_KEY = 'BKgn0lwYCrrfdSIX6PSaaR34nEO1g9FkZ9V3mlZmBAWY_fE7LcbI4osZ9CP8tQsfU1R5vLbg4S0GhNL3QiIOSnQ';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: '🔔 جدولك', body: 'عندك تذكير جديد' };
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
    dir: 'rtl',
    lang: 'ar',
    data: { url: (data.data && data.data.url) || '/' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Auto-heal when the browser push service rotates or invalidates keys after long inactivity
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    }).then(async (newSub) => {
      await fetch('/api/save-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: 'auto_renewed',
          subscription: newSub.toJSON(),
          reminders: []
        })
      });
    }).catch(err => console.warn('pushsubscriptionchange renewal failed:', err))
  );
});

// Tapping the notification focuses an already-open tab if one exists, otherwise opens
// a new one — standard PWA notification-click pattern.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
