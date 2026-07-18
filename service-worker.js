/* Service Worker for tabel reminders (Web Push)

Receives push events from the Cloudflare Worker and shows a notification.
*/

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let payload = { title: 'تذكير', body: 'لديك مهمة قادمة قريباً' };

    try {
      if (event.data) {
        const text = await event.data.text();
        payload = JSON.parse(text);
      }
    } catch {
      // ignore parsing errors; fall back to defaults
    }

    const title = payload.title || 'تذكير';
    const body = payload.body || '';
    const tag = payload.tag || 'abdullah-reminder';

    await self.registration.showNotification(title, {
      body,
      tag,
      data: payload.data || {}
    });
  })());
});

self.addEventListener('notificationclick', event => {
  event.waitUntil((async () => {
    try {
      const url = (event.notification && event.notification.data && event.notification.data.url)
        ? event.notification.data.url
        : '/';

      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const opened = clients.find(c => c.url === url);

      if (opened) {
        opened.focus();
        return;
      }

      await self.clients.openWindow(url);
    } catch {
      // ignore
    }
  })());
});

