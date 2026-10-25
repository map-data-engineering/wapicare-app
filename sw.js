// Service worker for the WapiCare PWA. It keeps the app itself (code,
// SQLite WebAssembly, map fonts, icons) so the app opens offline after the
// first visit. scripts/web.mjs fills in the file list and the version when it
// builds the site. The downloaded data lives in IndexedDB, not here, and
// requests to other sites (the routing Worker) are never touched.
const VERSION = "1b0b569fbcfd";
const BASE = "/wapicare-app";
const PRECACHE = "[\"/wapicare-app/_expo/static/css/maplibre-gl-251fdbfda84eb147f0a36795135ef43b.css\",\"/wapicare-app/_expo/static/js/web/entry-ef11ee61e2afbcd61168e10b138abaed.js\",\"/wapicare-app/assets/assets/images/ambulance.767e60715c009ae28799d136db02e021.jpg\",\"/wapicare-app/assets/assets/images/cholera.8b87628430ee826042d586630cd9fd4e.jpg\",\"/wapicare-app/assets/assets/images/landing.9f3665aa4da56777a2dbd6d0428312d1.jpg\",\"/wapicare-app/assets/assets/images/maternal.8cea757b2b04d5dd924ee0857e808fad.jpg\",\"/wapicare-app/assets/assets/images/vaccination.406eba2713284e29cfe11f0ab043280f.jpg\",\"/wapicare-app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.4e85bc9ebe07e0340c9c4fc2f6c38908.ttf\",\"/wapicare-app/assets/node_modules/expo-router/assets/arrow_down.017bc6ba3fc25503e5eb5e53826d48a8.png\",\"/wapicare-app/assets/node_modules/expo-router/assets/error.d1ea1496f9057eb392d5bbf3732a61b7.png\",\"/wapicare-app/assets/node_modules/expo-router/assets/file.19eeb73b9593a38f8e9f418337fc7d10.png\",\"/wapicare-app/assets/node_modules/expo-router/assets/forward.d8b800c443b8972542883e0b9de2bdc6.png\",\"/wapicare-app/assets/node_modules/expo-router/assets/pkg.ab19f4cbc543357183a20571f68380a3.png\",\"/wapicare-app/assets/node_modules/expo-router/assets/react-navigation/elements/back-icon-mask.0a328cd9c1afd0afe8e3b1ec5165b1b4.png\",\"/wapicare-app/assets/node_modules/expo-router/assets/react-navigation/elements/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png\",\"/wapicare-app/assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55.png\",\"/wapicare-app/assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@2x.png\",\"/wapicare-app/assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@3x.png\",\"/wapicare-app/assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@4x.png\",\"/wapicare-app/assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7.png\",\"/wapicare-app/assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@2x.png\",\"/wapicare-app/assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@3x.png\",\"/wapicare-app/assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@4x.png\",\"/wapicare-app/assets/node_modules/expo-router/assets/react-navigation/elements/search-icon.286d67d3f74808a60a78d3ebf1a5fb57.png\",\"/wapicare-app/assets/node_modules/expo-router/assets/sitemap.412dd9275b6b48ad28f5e3d81bb1f626.png\",\"/wapicare-app/assets/node_modules/expo-router/assets/unmatched.20e71bdf79e3a97bf55fd9e164041578.png\",\"/wapicare-app/favicon.ico\",\"/wapicare-app/icons/apple-touch-icon.png\",\"/wapicare-app/icons/favicon.png\",\"/wapicare-app/icons/favicon.svg\",\"/wapicare-app/icons/icon-192.png\",\"/wapicare-app/icons/icon-512.png\",\"/wapicare-app/icons/icon-maskable-512.png\",\"/wapicare-app/icons/icon-maskable.svg\",\"/wapicare-app/icons/icon.svg\",\"/wapicare-app/index.html\",\"/wapicare-app/manifest.webmanifest\",\"/wapicare-app/map-fonts/NotoSans-Italic/0-255.pbf\",\"/wapicare-app/map-fonts/NotoSans-Italic/256-511.pbf\",\"/wapicare-app/map-fonts/NotoSans-Italic/8192-8447.pbf\",\"/wapicare-app/map-fonts/NotoSans-Medium/0-255.pbf\",\"/wapicare-app/map-fonts/NotoSans-Medium/256-511.pbf\",\"/wapicare-app/map-fonts/NotoSans-Medium/8192-8447.pbf\",\"/wapicare-app/map-fonts/NotoSans-Regular/0-255.pbf\",\"/wapicare-app/map-fonts/NotoSans-Regular/256-511.pbf\",\"/wapicare-app/map-fonts/NotoSans-Regular/8192-8447.pbf\",\"/wapicare-app/sqlite/8d46d61c5133/sqlite-worker.js\",\"/wapicare-app/sqlite/8d46d61c5133/sqlite3.wasm\"]";
// Named wapicare- since the address moved from /healthscope/ (2026-10-25): the page left at the
// old address clears the healthscope- caches without touching this one.
const CACHE = `wapicare-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(JSON.parse(PRECACHE)))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => (k.startsWith('wapicare-') || k.startsWith('healthscope-')) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    // The page: fresh when online; offline, the saved one (every route is the same single-page app).
    event.respondWith(fetch(request).catch(() => caches.match(`${BASE}/index.html`)));
    return;
  }
  // Each build is saved as a whole (the cache is named after it), so a saved file always matches the rest.
  event.respondWith(caches.match(request).then((saved) => saved ?? fetch(request)));
});
