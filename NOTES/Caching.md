# Caching

### Caching Strategies:

- [Overview of all strategies](https://jakearchibald.com/2014/offline-cookbook/)

- **Cache, then Network** - more common and useful strategy. First get a resource from the cache to show immediately, and then fetch it from the network to get the most up to date version. Useful for fast UI loading.
  - Page reaches directly to the cache (no service worker involved, also need to check that the network wasn't faster than cache fetch so the network response isn't overwritten)
  - Simultaneously reach out to the Service Worker which intercepts the request to the network concurrently in the background and stores the response in the cache in the `fetch` lifecycle event (often dynamic caching is used in this strategy)
  - optionally return the resource from the service worker request to the page (if using dynamic caching). Note that every single response is stored in the cache, even if it was already there.
  - The app shell and any code that implements the strategy should be loaded first for offline use. In that case, the app will load the cached resources if they exist, and not always call the network for them.
    This is implementing the Cache First, Network Fallback strategy for the app shell, and implement the Cache, then Network strategy for desired resources.
- Dynamic Caching - cache resources as they are fetched.
- Static Caching - cache static assets like html,css,javascript
- Cache First with Network Fallback - good for speed, but not ideal if resources need to be very up to date
- Cache Only - Only ask the service worker to check and return items in the cache, no network fallback - not typically used except for certain resources if desired.
  - Makes sense to use for storing App shell assets, since they are updated in the cache when any changes are made and the service worker version is bumped, so there is no need to fetch updated resources from the network
- Network Only - no service worker is used. This is the default behavior of a web page. Can be used to funnel certain resources straight through on requesting.
- Network with Cache Fallback - Not common to use this strategy - Fetch first and check the cache if there's a failure. Disadvantage is bad user exp if network connection is slow or fails after a long time, leaving the user waiting. Can be used to fetch assets in the background if they're not needed immediately. Timeout problem is the main issue with this.

## Cache API

- There is a separate Cache API you can use as a developer to have control over caching assets
- You can see the caches by going to `dev tools` -> `Application` -> `Cache Storage` section on the right.
- Via the cache api you can have multiple sub caches (`caches.open()`)

### Storing schema

- The key of the item cached is the request url taken from event.request.url
- The value of the item cached is the response of the url

### Methods

- `caches.open()`: returns a Promise w/cache access - creates a cache with the name passed in if it doesn't exist
- `cache.add()`: Returns a Promise - This both makes a fetch request and stores the response in the designated cache
- `cache.put()`: Returns a Promise - a put does NOT make a fetch request and only stores an asset in the cache
- `cache.match(url)`: Returns a promise - how you get something from the cache - pass in the matching url
- `cache.delete()`: Returns a Promise - removes a cache by it's key

### What to Cache

- The app shell - everything but your dynamic content, toolbars, menus, assets (javascript files, html files, css files, images) etc.
- Dynamic content
- _Be careful about caching too much_ - the browser may clear the cache if memory threshold is exceeded

You at least want to cache the app shell.

### Pre-caching app shell

- Pre-cache static content at the `install` event of the service worker

  - cache assets such as index.html, images, scripts, css, CDN assets, etc. with `caches.open(<request_path_to_asset>)`

    - this makes a request to fetch the asset and store it if it isn't already stored
    - pass in request urls
    - **You need to cache the first root request url** ` cache.addAll(["/"]);`
      Ex:

    ```javascript
    self.addEventListener("install", function (event) {
      console.log("Service Worker, install");

      event.waitUntil(
        caches.open("static").then(function (cache) {
          console.log("precaching app shell");
          cache.addAll([
            "/", // you need to cache this request to the root first!
            "/index.html",
            "/src/js/app.js",
            "/src/js/feed.js",
            "/src/js/promise.js",
            "/src/js/fetch.js",
            "/src/js/material.min.js",
            "src/css/app.css",
            "src/css/feed.css",
          ]);
        })
      );
    });
    ```

- Check the cache and use assets in cache in the `fetch` event callback with `caches.match(event.request)` - pass in a request object, a request is not made with match, only a check is made on the requested asset to see if it is stored - if the asset is not in the cache, then a null response will be returned from the promise

### Dynamic Caching

- Intercept fetch calls to store additional pages and assets in the cache using `cache.put()` which does not make a url reqeust but intercept the fetch in the `fetch` event emitted and store in the cache, finally returning the response to the client.
  Ex:

  ```javascript
  self.addEventListener("fetch", function (event) {
    // use event.respondWith() to intercept the request/response and modify it.  If you pass in `null` then the response is overriden with nothing
    event.respondWith(
      caches.match(event.request).then(function (result) {
        if (result) {
          return result;
        } else {
          // if you don't have the item in the cache, request it and then store it, and finally return the response to the requester
          return fetch(event.request)
            .then(function (response) {
              return caches.open("dynamic").then(function (cache) {
                // put does not make a req like add does, and requires a clone of the response since response is consumable only one time and you need to return it from this function to the client after this:
                cache.put(event.request.url, response.clone());
                return response;
              });
            })
            .catch(function (err) {
              console.error(err);
            });
        }
      })
    );
  });
  ```

  ### Store an Offline page for the user to see

  - See the commit `Show Offline Page` or any `offline page` commit in the repo
  - Route to return the offline page only if a route that is not cached is navigated to (you don't want to return an offline page if another request fails, like a css file or something like that is not found)
  - Check the request accept header to determine if the fetch is for a page or other file:

  ```javascript
  // the header accept on the request indicates what answer the request gets back - if it gets back text/html, it's a page and appropriate to send back the offline page.
  if (event.request.headers.get("accept").includes("text/html")) {
    return cache.match("/offline.html");
  }
  ```

  ### Returning Fallback files:

  - Check the request accept header and return an appropriate fallback file, i.e. an offline page (accept = 'text/html') or a default fallback image (accept = 'image/jpeg')
  - You just need to precache the fallback file as part of your static assets/app shell that are cached on the service worker install.

  ### Cache Versioning

  - ### Gotcha:
    - If a file that is cached is changed without updating the service worker, the sw will simply retrieve the old cached version and not the updated one.
  - **This is solved by versioning the names of your caches in the service worker, i.e. `caches.open('static-v2')`, during the `activate` lifecycle event**
    - This prompts a new service worker to be installed and store the new files in the cache
    - You need to clean up the old sub-caches as new versions are created
    - note that calling `caches.match(req)` in the sw looks at all caches, so it will find an old file in an old cache if it hasn't been cleaned up.
  - **IMPORTANT:** You need to bump the version name of your cache every time you make an update to cached files outside the service worker (if you don't change the service worker code in your work session)
    - **NOTE:** An alternative quicker way to get the latest changes in development is to go to the dev tools and clear the site data and refresh:
      - Go to `Applications -> Clear Storage -> Clear site data`
      - Refresh the page.

### Trimming the Cache

- You want to trim your cache to free up resources and prevent memory limits from being reached
- You can do this anywhere you feel appropriate in the service worker
- Look up memory limits for browsers to determine how many items you should keep cached
- Keep in mind you can also access the cache outside of the service worker and trim it in other parts of your javascript codebase

## Other Resources:

- Advanced Caching Guide: https://afasterweb.com/2017/01/31/upgrading-your-service-worker-cache/
- Mozilla Strategy Cookbook: https://serviceworke.rs/strategy-cache-and-update_service-worker_doc.html
