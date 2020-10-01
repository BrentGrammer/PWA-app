// import the library for the version of workbox you are using above
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/5.1.4/workbox-sw.js"
);
// imports for using indexedDB using idb library
importScripts("/src/js/idb.js"); // idb is a package to wrap the indexedDB api to use promises instead of callbacks.
// importScripts is how you can import javascript into your service worker code
importScripts("/src/js/utility.js");

/**
 * This base sw file is used to build upon using the injectManifest script from Workbox
 * You can use this approach to customize your caching and implement routing, etc.
 * The cache list file manifest generated by Workbox-cli is injected into this file and the result is copied to service-worker.js
 */

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

// custom route handling strategy, but still take advantage of Workbox routing management
// can be used if you need a caching strategy that is not provided by WB library (for instance, an indexedDB strategy)
// pass a second argument function which takes args representing the fetch request event
registerRoute(
  "https://pwa-practice-app-289604.firebaseio.com/posts.json",
  (args) => {
    // return a promise that yields a response.  access the fetch event on args
    return fetch(args.event.request).then((res) => {
      // clear storage in indexedDB to prevent sync errors (deleted item from backednd remaining stored in cache)
      var clonedRes = res.clone();

      clearAllData("posts")
        .then(() => {
          // store this dynamic data in indexedDB.  Make a clone, Transform and store it
          return clonedRes.json();
        })
        .then((data) => {
          Object.keys(data).forEach((key) => {
            writeData("posts", data[key]);
          });
        });
      // return the original request
      return res;
    });
  }
);

// Pass a function as the first argument to target specific routes based on their headers, etc.
// This is to cache the offline fallback page we created - need to do this because we want to return a specific html page respnse if certain conditions are met
workbox.routing.registerRoute(
  function (routeData) {
    // you have access to the request route in here through routeData - you can check the headers for all requests asking for html pages
    return routeData.event.request.headers.get("accept").includes("text/html");
  },
  function (args) {
    // in your custom handler, return the requested html page requested if possible, or the fallback offline.html page if not possible
    return caches.match(args.event.request).then(function (responseInCache) {
      if (responseInCache) {
        // return the res for the request in the cache if it is already stored
        return responseInCache;
      } else {
        // fallback to network req if html page not found in the cache
        return fetch(args.event.request)
          .then(function (res) {
            // store the response in cache if successful network response
            return caches.open("dynamic").then(function (cache) {
              cache.put(args.event.request.url, res.clone());
              return res;
            });
          })
          .catch(function (err) {
            // if you error on the request, then fallback to getting our custom offline page from the cache
            // using workbox.precaching.getCacheKeyForURL() instead of just 'offline.html - needed for WB v5
            return caches
              .match(workbox.precaching.getCacheKeyForURL("/offline.html"))
              .then(function (res) {
                return res;
              });
            // Our offline.html page is cached in the workbox-config.js since we cache all html request responses in the globPatterns property
          });
      }
    });
  }
);

workbox.precaching.precacheAndRoute([{"revision":"2cab47d9e04d664d93c8d91aec59e812","url":"favicon.ico"},{"revision":"226ee72bc9d4ede889b7c6ce6cc1f6ca","url":"index.html"},{"revision":"0b2b1e99fb157c1dfea95a2d5954d723","url":"manifest.json"},{"revision":"cd12c110221438375eacd91f061ab509","url":"offline.html"},{"revision":"59d917c544c1928dd9a9e1099b0abd71","url":"src/css/app.css"},{"revision":"cbabf4fff1915f8a2b9b8635c5aeb680","url":"src/css/feed.css"},{"revision":"1c6d81b27c9d423bece9869b07a7bd73","url":"src/css/help.css"},{"revision":"f7febb4f4ef7e17392acae4bdc0bbd6b","url":"src/js/app.min.js"},{"revision":"e11e8f4a5ba7411524a7c569ca7a5581","url":"src/js/feed.min.js"},{"revision":"32590119a06bf9ade8026dd12baa695e","url":"src/js/fetch.min.js"},{"revision":"ea82c8cec7e6574ed535bee7878216e0","url":"src/js/idb.min.js"},{"revision":"713af0c6ce93dbbce2f00bf0a98d0541","url":"src/js/material.min.js"},{"revision":"7be19d2e97926f498f2668e055e26b22","url":"src/js/promise.min.js"},{"revision":"48575845c554a9d095ff04cf1c74bddf","url":"src/js/utility.min.js"},{"revision":"31b19bffae4ea13ca0f2178ddb639403","url":"src/images/main-image-lg.jpg"},{"revision":"c6bb733c2f39c60e3c139f814d2d14bb","url":"src/images/main-image-sm.jpg"},{"revision":"5c66d091b0dc200e8e89e56c589821fb","url":"src/images/main-image.jpg"},{"revision":"0f282d64b0fb306daf12050e812d6a19","url":"src/images/sf-boat.jpg"}]);

/**
 * Push notification and background sync implementation
 *   - Workbox does not currently provide an implementation for this, so you need to write your own
 *   - You can add any valid sw code in this file just fine - this is added after the precaching line above
 */

// Sync Data from background sync tasks
// 'sync' event is emitted when connectivity is re-established
// 'sync also fires if connected, but a new sync task is registered
self.addEventListener("sync", function (event) {
  console.log(
    "[Service Worker] Background Syncing - sync event emitted",
    event
  );
  // the event has a tag on it which matches the one you set in the task registration (feed.js)
  if (event.tag === "sync-new-posts") {
    console.log("[Sevice Worker] Syncing new posts.");
    // wait for event sending the data is finished
    event.waitUntil(
      // uses idb to read data from indexedDB - custom helper we created returns a promise
      readAllData("sync-posts").then(function (data) {
        // loop through data in indexedDB if user sent more than one post to sync
        for (var dt of data) {
          // we send formData now, not application/json, which includes our image BLOB taken for the post:
          var postData = new FormData();
          postData.append("id", dt.id);
          postData.append("title", dt.title);
          postData.append("location", dt.location);
          postData.append("rawLocationLat", dt.rawLocation.lat); // rawLocation is what we're storing in indexedDB in feed.js from getting the position
          postData.append("rawLocationLng", dt.rawLocation.lng);
          postData.append("file", dt.picture, dt.id + ".png"); // you can overwrite the name of a file with the third argument.  You may also want to get the mime type to append instead of hardcoding png

          syncData(postData);
        }
      })
    );
  }
});

function syncData(postData) {
  // fetch url is to a google cloud function
  const url =
    "https://us-central1-pwa-practice-app-289604.cloudfunctions.net/storePostData ";
  return fetch(url, {
    method: "POST",
    // We don't need headers now and want to be able to accept form data for storing the image taken for a post from the camera
    // if we don't have any headers, then the type of data will automatically be inferred, so we remove the headers parameter sent with the request
    // headers: {
    //   "Content-Type": "application/json",
    //   Accept: "application/json",
    // },
    body: postData,
  })
    .then(async (res) => {
      // clean up and remove the post data for the task stored in indexedDB
      if (res.ok) {
        const parsed = await res.json();
        console.log({ parsed });

        deleteItemFromData("sync-posts", parsed.id); // return this?
      } else {
        throw new Error("Bad Response"); // suggested in QA for syncing issues?
      }
    })
    .catch((e) => {
      console.error(e);
    });
}

// Handle notification action clicks by the user
self.addEventListener("notificationclick", function (event) {
  // find out which notification it was for
  var notification = event.notification;
  // find which action was clicked
  var action = event.action; // this matches up to the id set up in the `action` prop in app.js

  if (action === "confirm") {
    console.log("confirm was chosen");
    // close the notification - it does not close automatically on some OSs (android)
    notification.close();
  } else {
    // this is how to open a new page is opened from a notification
    // go to a page the user has open for the app if there is one, or open a window and go to a page
    // use waituntil to tell the service worker not to continue until the page has been opened and this code has run
    event.waitUntil(
      // clients refers to all windows or browser tasks related to this service worker
      clients.matchAll().then(function (clis) {
        // find windows managed by service worker that are visible (open windows where our app is running)
        var client = clis.find(function (c) {
          // find the first app window that is visible
          return c.visibilityState === "visible";
        });

        console.log({ client }, clis.length);

        if (client !== undefined) {
          // if window is open, then go to a page url passed in:
          client.navigate(notification.data.openUrl); // comes from the data payload passed with the push notification on your server
          client.focus();
        } else {
          // if no open window then open one with the clients API
          clients.openWindow(notification.data.openUrl);
        }
        notification.close();
      })
    );
  }
});

self.addEventListener("notificationclose", function (event) {
  console.log("notification closed.");
});

// listen to Push Notifications
self.addEventListener("push", function (event) {
  console.log("push notif reveiberd", event);

  // set a fallback data payload if no payload is found on the push notif
  var data = { title: "Fallback", content: "Fallback content", openUrl: "/" };

  // check for the payload sent with the push notif
  if (event.data) {
    data = JSON.parse(event.data.text()); // need text() to extract the json to a string
  }

  var options = {
    body: data.content,
    icon: "/src/images/icons/app-icon-96x96.png",
    badge: "/src/images/icons/app-icon-96x96.png",
    data: { openUrl: data.openUrl }, // data is used to pass metadata you can use - in this case it is used in the notificationclick listener.  The openUrl is set on the backend in index.js
  };

  // use waituntil to make sure service worker waits until you show the notification
  event.waitUntil(
    // the sw itself cannot show a notification, you need access to the service worker Registration
    // NOTE: the sw registration is the part that connects the service worker to the browser
    self.registration.showNotification(data.title, options) //takes title and standard notification options
  );
});
