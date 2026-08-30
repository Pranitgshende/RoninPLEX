const url = 'http://127.0.0.1:4173/proxy?url=https%3A%2F%2Fvivibebe.site%2Fpublic%2Fstream%2Fe468d3e4c2008509%2Fmaster.m3u8&h=eyJSZWZlcmVyIjoiaHR0cHM6Ly92aXZpYmViZS5zaXRlLyIsIlVzZXItQWdlbnQiOiJNb3ppbGxhLzUuMCAoTWFjaW50b3NoOyBJbnRlbCBNYWMgT1MgWCAxMF8xNV83KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIFNhZmFyaS81MzcuMzYifQ%3D%3D';

(async () => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);
      const headRes = await global.fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-1000' }, signal: controller.signal });
      clearTimeout(id);
      console.log('Status:', headRes.status);
      console.log('Content-Type:', headRes.headers.get('content-type'));
      console.log('ok:', headRes.ok);
    } catch (e) {
      console.error('Error:', e.message);
    }
})();
