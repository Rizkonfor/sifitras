/* SIFITRAS — pekerja latar belakang
   Menyimpan salinan aplikasi di perangkat supaya tetap bisa dibuka tanpa internet. */

const VERSI = 'sifitras-v202610181800';
const INTI = [
  './',
  './index.html',
  './manifest.json',
  './icon-32.png',
  './icon-48.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

/* Berkas dari luar (huruf & pembaca QR). Kalau gagal diambil, aplikasi tetap jalan:
   QR otomatis diganti barcode Code39 yang dibuat sendiri di dalam aplikasi. */
const LUAR = [
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSI);
    /* Tidak ada berkas yang boleh menggagalkan pemasangan. Kalau pemasangan
       pekerja latar gagal, Chrome menolak memasang aplikasinya dan bilah alamat
       tetap muncul di atas. Berkas yang belum sempat tersimpan akan diambil
       sendiri saat halaman dibuka, lewat penangan fetch di bawah. */
    try { await c.add('./index.html'); } catch (err) {
      try { await c.add('./'); } catch (err2) {}
    }
    const sisa = INTI.filter(u => u !== './index.html');
    await Promise.all(sisa.concat(LUAR).map(u => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const nama = await caches.keys();
    await Promise.all(nama.filter(n => (n.indexOf('sifitras-') === 0 || n.indexOf('simsar-') === 0) && n !== VERSI).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const seRumah = url.origin === self.location.origin;

  // Halaman: coba jaringan dulu supaya pembaruan aplikasi cepat terpakai,
  // kalau tidak ada internet pakai salinan tersimpan.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        const c = await caches.open(VERSI);
        c.put('./index.html', r.clone());
        return r;
      } catch (err) {
        const c = await caches.open(VERSI);
        return (await c.match('./index.html')) || (await c.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Berkas pendukung: pakai salinan dulu supaya cepat, sambil diperbarui diam-diam.
  e.respondWith((async () => {
    const c = await caches.open(VERSI);
    const simpan = await c.match(req);
    const jaringan = fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()).catch(() => {});
      return r;
    }).catch(() => null);

    if (simpan) { jaringan; return simpan; }
    const r = await jaringan;
    if (r) return r;
    // Tidak ada salinan dan tidak ada internet
    if (seRumah) return new Response('', { status: 504, statusText: 'Tidak ada internet' });
    return new Response('', { status: 504 });
  })());
});

/* Perintah dari aplikasi: pasang pembaruan sekarang */
self.addEventListener('message', e => {
  if (e.data === 'perbarui') self.skipWaiting();
});
