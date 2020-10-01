# Background Sync

- Relatively new feature and browser support may be limited, but growing.
- Store requests user sends while offline and send them when connectivity is regained later.
- `SyncManager` is the api that is exposed to register background sync tasks
  - [ See MDN Entry with Browser Support](https://developer.mozilla.org/en-US/docs/Web/API/SyncManager)
- The `sync` event fires when you:
  - Register a sync task (usually done when sending a request)
  - Re-establish Connection - (this can vary by browser - some may wait 5 or 15 minutes to fire the event)

### Process:

- Service Worker registers and saves a _sync task_ to send data over the wire
  - On submit, a background sync task is stored (see feed.js) and Data which the user wants to send is stored in indexedDB, for example
    - Create a separate store(table) in indexedDB to store data to be sent
    - register this task in an event handler where your submit/user input event occurs to send a request
- If connection, then task is executed immediately, otherwise:
- When internet connection is re-established a `sync` event is emitted to the service worker, the task is executed
- Provide a fallback to just send the data regularly in an immediate request
- **NOTE: This task is executed even if the tab or app/browser is closed on the device!**

### Register a task:

```javascript
// Register background sync request
if ("serviceWorker" in navigator && "SyncManager" in window) {
  // check ready on service worker to make sure it is configured/installed and ready to take input
  navigator.serviceWorker.ready.then(function (sw) {
    var post = {
      //...request data,
    };
    //store the data to send in a separate table in indexedDB
    writeData("sync-posts", post)
      .then(function () {
        // register the task and pass in an id tag for it
        // this tag will be referenced when the sync event is emitted in the sw
        return sw.sync.register("sync-new-post");
      })
      .then(function () {
        //optionally give user feedback 'saved for syncing'
      })
      .catch(function (err) {
        console.error(err);
      });
  });
} else {
  // fallback if browser does not support service worker (send data to network here)
}
```

### Syncing Data in the Service Worker

- `sync` event is emitted when connectivity is re-established and there is a task that is waiting to be executed
- `sync` also fires if connected, but a new sync task is registered
- Get associated data to send stored in indexedDB
- Loop through it and send to network
- clean up indexedDB if requests were successful

```javascript
self.addEventListener("sync", function (event) {
  console.log("[Service Worker] Background Syncing", event);
  // the event has a tag on it which matches the one you set in the task registration (feed.js)
  if (event.tag === "sync-new-posts") {
    // wait for event sending the data is finished
    event.waitUntil(
      readAllData("sync-posts").then(function (data) {
        // loop through data if user sent more than one post to sync
        for (var dt of data) {
          syncData(dt); // make your fetch request and clean up indexedDB - make sure to use a closure in the for loop so you don't only remove the last data entry
        }
      })
    );
  }
});
```

### Troubelshooting

- In dev, you may need to completely disconnect your internet and reconnect to get background sync working (not just checking offline in dev tools)

## Periodic Sync

- Not supported by browsers yet, coming in the future
- Getting data as a background process and update app by making network requests on an interval/schedule
  - Fetches data even if app is not opened (requires connection)
