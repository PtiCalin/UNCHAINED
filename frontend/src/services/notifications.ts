// Simple SSE listener + desktop notifications
export function startNotifications(baseUrl: string) {
  try {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then((perm) => {
      if (perm !== 'granted') return;
      const es = new EventSource(`${baseUrl}/sources/events/stream`);
      es.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          let title = 'UNCHAINED';
          let body = payload.message || '';
          if (payload.type === 'upload_complete') {
            title = 'Upload complete';
          } else if (payload.type === 'download_finished') {
            title = 'Download finished';
          }
          new Notification(title, { body });
        } catch (e) {
          console.warn('Notification parse error', e);
        }
      };
      es.onerror = (e) => {
        console.warn('SSE error', e);
      };
    });
  } catch (e) {
    console.warn('Notifications setup error', e);
  }
}
