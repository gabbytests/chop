const CACHE_NAME = "chawmp-cache-v2";
const urlsToCache = [
    "/",
    "/index.html",
    "/cart.html",
    "/vendor/bootstrap/css/bootstrap.min.css",
    "/vendor/slick/slick/slick.css",
    "/vendor/slick/slick/slick-theme.css",
    "/vendor/icons/feather.css",
    "/img/fav.png",
    "/img/icon-192x192.png",
    "/img/icon-512x512.png",
    "/manifest.json",
    "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js",
    "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) return response;
                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200 || response.type !== "basic") {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, responseToCache));
                        return response;
                    });
            })
            .catch(() => {
                return caches.match("/index.html");
            })
    );
});

// Handle push notifications
self.addEventListener("push", event => {
    const data = event.data.json();
    const title = data.notification.title;
    const options = {
        body: data.notification.body,
        icon: "/img/icon-192x192.png",
        data: { url: "/index.html" } // Default URL to open on click
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", event => {
    event.notification.close();
    const url = event.notification.data.url || "/index.html";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true })
            .then(clientList => {
                for (const client of clientList) {
                    if (client.url.includes(url) && "focus" in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});