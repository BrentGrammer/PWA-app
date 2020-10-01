importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/5.1.4/workbox-sw.js"
);
// import the library for the version of workbox you are using above

workbox.setConfig({
  debug: true, // set if you want to see console log statements
});

// Use the imported Workbox libraries to dynamically cache route responses:
const { registerRoute } = workbox.routing;
const { NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
// cache strategies to use:
const { ExpirationPlugin } = workbox.expiration;

/**
 * NOTE: The order you register routes in matters (like a Switch Router)
 * - More specific routes need to come BEFORE more general route matches
 *    - for instance the post images cache route needs to come first because it includes googleapis which
 *      would have been caught by the latter google font route since it is more general and captures that
 *   (the post images cache would not be created)
 */

// make sure firebase stored images from posts don't go into the google api fonts cache above
registerRoute(
  /.*(?:firebasestorage\.googleapis)\.com.*$/,
  new StaleWhileRevalidate({ cacheName: "post-images" })
);

// Dynamic caching/routing for google fonts - use the reg exp to capture all requests in index.html to google apis for font loading and cache the response
registerRoute(
  /.*(?:googleapis|gstatic)\.com.*$/,
  new StaleWhileRevalidate({
    cacheName: "google-fonts",
    plugins: [
      // this sets a timestamp entry in indexedDB for the assets which it manages and checks to automatically remove when expiration comes
      new ExpirationPlugin({
        maxEntries: 3, // we only have 3 fonts we're using, don't store more
        maxAgeSeconds: 60 * 60 * 24 * 30, // not necessarily with staleWhileRevalidate, but done here for example
      }),
    ],
  }) // this reaches out to the cache to get the resource, but also makes a request which if successful, will replace the cached item with the updated resource -
);

// Dynamically cache Material-Design lite css CDN assets:
// note: you can pass in @variablename syntax to the express url in the first arg if needed
registerRoute(
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
  new StaleWhileRevalidate({ cacheName: "material-css" })
);

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);
