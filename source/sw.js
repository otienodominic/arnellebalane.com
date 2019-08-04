importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');

workbox.core.skipWaiting();
workbox.precaching.precacheAndRoute([]);
workbox.precaching.precache(['/offline/']);

const persistentPages = ['/', '/blog/', '/events/', '/projects/'];
const persistentPagesStrategy = new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'persistent-pages',
    plugins: [
        new workbox.broadcastUpdate.Plugin({
            channelName: 'page-updated'
        })
    ]
});

persistentPages.forEach(path => {
    workbox.routing.registerRoute(path, persistentPagesStrategy);
});

// https://developers.google.com/web/tools/workbox/guides/advanced-recipes#provide_a_fallback_response_to_a_route
workbox.routing.setCatchHandler(context => {
    if (context.event.request.destination === 'document') {
        return caches.match('/offline/');
    }
    return Response.error();
});
