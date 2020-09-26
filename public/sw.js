importScripts("/src/js/idb.js"); // idb is a package to wrap the indexedDB api to use promises instead of callbacks.
// importScripts is how you can import javascript into your service worker code
importScripts("/src/js/utility.js");

// For cache versioning. Anytime you change any of your cached assets (code other than your service worker), bump these version numbers up.
// the reason is that the old cached version of the asset (i.e. a javascript file is being used by the app)
var CACHE_STATIC_NAME = "static-v27";
var CACHE_DYNAMIC_NAME = "dynamic-v15";

var STATIC_FILES = [
  "/", // you need to cache this request to the root first!
  "/index.html",
  "/offline.html", // cache your offline default page to show - fetch this from the cache in the catch block of the 'fetch' lifecycle event
  "/src/js/app.js",
  "/src/js/feed.js",
  "/src/js/promise.js",
  "/src/js/fetch.js",
  "/src/js/idb.js",
  "/src/js/material.min.js",
  "src/css/app.css",
  "src/css/feed.css",
  "src/images/main-image.jpg",
  "https://fonts.googleapis.com/css?family=Roboto:400,700", //cache CDN assets from head section in index.html
  "https://fonts.googleapis.com/icon?family=Material+Icons", // NOTE: the material icons make subsedquent requests for the actual icons and this does not catch or make those - the dynamic caching on the fetch event will cache those subsequent nested requests
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
];

// for example purposes, not used
// you sometimes want to trim the cache if it becomes too large to free up resources:
// function trimCache(cacheName, maxItems) {
//   caches.open(cacheName).then(function (cache) {
//     return cache
//       .keys() // returns a promise
//       .then(function (keys) {
//         if (keys.length > maxItems) {
//           cache
//             .delete(keys[0]) // delete the oldest item which is at the top of the list of keys
//             .then(trimCache(cacheName, maxItems)); // call recursively to delete rest of items to max num
//         }
//       });
//   });
// }

// use self.addListener to register listeners to the service worker, here you have access to non-DOM special events
self.addEventListener("install", function (event) {
  console.log("Service Worker, install");
  // use cache api to open a caches to store static assets such as images, html, css for your app shell. see dev tools -> application -> Cache Storage in Chrome
  // NOTE: code is asynchronous and you need to use waitUntil to tell the worker not to exit this block before the caches.open is complete!
  // caches.open will create the cache if it doesn't exist, or open it if it does already
  event.waitUntil(
    // give a string name to the sub cache to save your assets
    caches.open(CACHE_STATIC_NAME).then(function (cache) {
      console.log("precaching app shell");
      // the strings are request urls relative to your domain
      cache.addAll(STATIC_FILES);
    })
  );
});

// NOTE: activation will not occur if the app is already running in a tab during installation - you need to close and reopen the tab to activate the worker, or click skip waiting in devtools and refresh
self.addEventListener("activate", function (event) {
  console.log("Service Worker, activate");
  //Clean up old caches here after versioning to a new one - use waitUntil since you don't want to delete an old cache before the new sw gets activated and break the app
  event.waitUntil(
    // cache.keys gives you the names of your sub-caches as a list returned in a promise
    caches.keys().then((keyList) => {
      // use Promse.all and map over the keyList calling caches.delete which returns a promise.  Promise.all will wait until all of those promises are done.
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log("SW: deleting cache " + key, key !== "static-v2");
            return caches.delete(key); //delete returns a promise
          }
        })
      );
    })
  );
  // you need this line to make activation more robust when it fails
  return self.clients.claim();
});

//Cache First with Network Fallback strategy if item isn't already in the cache
// self.addEventListener("fetch", function (event) {

//   // use event.respondWith() to intercept the request/response and modify it.  If you pass in `null` then the response is overriden with nothing
//   event.respondWith(
//     caches.match(event.request).then(function (result) {
//       if (result) {
//         return result;
//       } else {
//         // if you don't have the item in the cache, request it and then store it, and finally return the response to the requester
//         return fetch(event.request)
//           .then(function (response) {
//             return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
//               //put does not make a req like add does, and requires a clone of the response since response is consumable only one time and you need to return it from this function to the client after this:
//               cache.put(event.request.url, response.clone());
//               return response;
//             });
//           })
//           .catch(function (err) {
//             console.log("in catch");
//             // fetch your default offline page stored in the cache
//             return caches.open(CACHE_STATIC_NAME).then(function (cache) {
//               return cache.match("/offline.html");
//             });
//           });
//       }
//     })
//   );
// });

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) {
    // request targets domain where we serve the page from (i.e. NOT a CDN)
    console.log("matched ", string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

// Cache, then Network Strategy implementation (in combo with code in feed.js fetch section)
self.addEventListener("fetch", function (event) {
  // intercept the fetch from feed.js and store the result in the cache and return res to page
  // with this in place, the network res is cached and a previous cached result is displayed during the request
  const url = "https://pwa-practice-app-289604.firebaseio.com/posts.json";

  //
  if (event.request.url.indexOf(url) > -1) {
    // only implement cache network response all the time if the url is dynamic content we want updated and not part of the app shell etc.
    event.respondWith(
      fetch(event.request).then(function (res) {
        // can trim the cache to free up resources
        //trimCache(CACHE_DYNAMIC_NAME, 3); // you can look up memory limits for the cache for different browsers
        // clear storage in indexedDB to prevent sync errors (deleted item from backednd remaining stored in cache)
        clearAllData("posts")
          .then(function () {
            // store this dynamic data in indexedDB.  Make a clone, Transform and store it
            var clonedRes = res.clone();
            return clonedRes.json();
          })
          .then(function (data) {
            Object.keys(data).forEach((key) => {
              writeData("posts", data[key]);
            });
          });
        // return the original request
        return res;
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    // Cache-only strategy to load app shell assets since these are updated with every change and bump to the sw version and there is no need to refetch them from the network
    event.respondWith(caches.match(event.request));
  } else {
    // cache the app shell resources and code that implements the Cache, then Network Strategy.
    // Now you will check the app shell resources first and use them without making a network request and updating them if they're already in the cache
    event.respondWith(
      caches.match(event.request).then(function (result) {
        if (result) {
          return result;
        } else {
          // if you don't have the item in the cache, request it and then store it, and finally return the response to the requester
          return fetch(event.request)
            .then(function (response) {
              return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
                //trimCache(CACHE_DYNAMIC_NAME, 3);
                //put does not make a req like add does, and requires a clone of the response since response is consumable only one time and you need to return it from this function to the client after this:
                cache.put(event.request.url, response.clone());
                return response;
              });
            })
            .catch(function (err) {
              console.log("in catch");
              // fetch your default offline page stored in the cache
              return caches.open(CACHE_STATIC_NAME).then(function (cache) {
                // route to return the offline page only if a route that is not found is navigated to
                // it doesn't make sense to return an offline html page for any failed request, i.e. if a css file is not found in the cache, for example
                // the header accept on the request indicates what answer the request gets back - if it gets back text/html, it's a page and appropriate to send back the offline page.
                // NOTE: You can use this type of check to return any type of fallback file, i.e. an image if the accept header is 'image/jpg' for example
                if (event.request.headers.get("accept").includes("text/html")) {
                  return cache.match("/offline.html");
                }
              });
            });
        }
      })
    );
  }
});

// Network First with Cache Fallback strategy - disadvantage is waiting to fail on a slow connection
// self.addEventListener("fetch", function (event) {
//   // fetch the resource and handle any error.  No need for a then since you just let the fetch complete
//   // use event.respondWith() to intercept the request/response and modify it.  If you pass in `null` then the response is overriden with nothing
//   event.respondWith(
//     fetch(event.request).catch(function (err) {
//       // if req fails, then reach out to the cache for the resource
//       return caches.match(event.request);
//     })
//   );
// });

// Cache-only
// self.addEventListener("fetch", function (event) {
//   // Cache Only Strategy - do not fallback to network
//   event.respondWith(caches.match(event.request));
// });

//Network-only
// self.addEventListener("fetch", function (event) {
//   // Cache Only Strategy - do not fallback to network
//   event.respondWith(fetch(event.request));
// });

// Sync Data from background sync tasks
// 'sync' event is emitted when connectivity is re-established
// 'sync also fires if connected, but a new sync task is registered
self.addEventListener("sync", function (event) {
  console.log("[Service Worker] Background Syncing", event);
  // the event has a tag on it which matches the one you set in the task registration (feed.js)
  if (event.tag === "sync-new-posts") {
    console.log("[Sevice Worker] Syncing new posts.");
    // wait for event sending the data is finished
    event.waitUntil(
      readAllData("sync-posts").then(function (data) {
        // loop through data if user sent more than one post to sync
        for (var dt of data) {
          syncData(dt);
        }
      })
    );
  }
});

function syncData(dt) {
  // fetch url is to a google cloud function
  const url =
    "https://us-central1-pwa-practice-app-289604.cloudfunctions.net/storePostData ";
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      id: dt.id,
      title: dt.title,
      location: dt.location,
      image: "image url",
    }),
  })
    .then(function (res) {
      console.log("sent data over the wire ", res);
      // clean up and remove the post data for the task stored in indexedDB
      if (res.ok) {
        deleteItemFromData("sync-posts", dt.id);
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
    console.log(action);
    notification.close();
  }
});

self.addEventListener("notificationclose", function (event) {
  console.log("notification closed.");
});

// listen to Push Notifications
self.addEventListener("push", function (event) {
  console.log("push notif reveiberd", event);

  // set a fallback data payload if no payload is found on the push notif
  var data = { title: "Fallback", content: "Fallback content" };

  // check for the payload sent with the push notif
  if (event.data) {
    data = JSON.parse(event.data.text()); // need text() to extract the json to a string
  }

  var options = {
    body: data.content,
    icon: "/src/images/icons/app-icon-96x96.png",
    badge: "/src/images/icons/app-icon-96x96.png",
  };

  // use waituntil to make sure service worker waits until you show the notification
  event.waitUntil(
    // the sw itself cannot show a notification, you need access to the service worker Registration
    // NOTE: the sw registration is the part that connects the service worker to the browser
    self.registration.showNotification(data.title, options) //takes title and standard notification options
  );
});
