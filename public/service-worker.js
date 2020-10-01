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

workbox.precaching.precacheAndRoute([{"revision":"0a27a4163254fc8fce870c8cc3a3f94f","url":"404.html"},{"revision":"2cab47d9e04d664d93c8d91aec59e812","url":"favicon.ico"},{"revision":"3fe94e640f337a6b3d854ba93513da44","url":"index.html"},{"revision":"0b2b1e99fb157c1dfea95a2d5954d723","url":"manifest.json"},{"revision":"cd12c110221438375eacd91f061ab509","url":"offline.html"},{"revision":"59d917c544c1928dd9a9e1099b0abd71","url":"src/css/app.css"},{"revision":"cbabf4fff1915f8a2b9b8635c5aeb680","url":"src/css/feed.css"},{"revision":"1c6d81b27c9d423bece9869b07a7bd73","url":"src/css/help.css"},{"revision":"a2133968e5742d0f49982f43b02718dc","url":"src/js/app.js"},{"revision":"77973ff360562b116ebae060e6d427e9","url":"src/js/feed.js"},{"revision":"6b82fbb55ae19be4935964ae8c338e92","url":"src/js/fetch.js"},{"revision":"017ced36d82bea1e08b08393361e354d","url":"src/js/idb.js"},{"revision":"713af0c6ce93dbbce2f00bf0a98d0541","url":"src/js/material.min.js"},{"revision":"10c2238dcd105eb23f703ee53067417f","url":"src/js/promise.js"},{"revision":"3873e7427f7282225cb4c7c73254e802","url":"src/js/utility.js"},{"revision":"5eae3e8f3180c6535f2f8306900b7ef3","url":"sw.js"},{"revision":"104536ce72429ec1f598883183de70b7","url":"workbox-69b5a3b7.js"},{"revision":"31b19bffae4ea13ca0f2178ddb639403","url":"src/images/main-image-lg.jpg"},{"revision":"c6bb733c2f39c60e3c139f814d2d14bb","url":"src/images/main-image-sm.jpg"},{"revision":"5c66d091b0dc200e8e89e56c589821fb","url":"src/images/main-image.jpg"},{"revision":"0f282d64b0fb306daf12050e812d6a19","url":"src/images/sf-boat.jpg"}]);
