# Service Workers

- Run in the background as background processes even and stays running after the app is closed.
- **Code in service workers is asynchronous!**
  - Dealing with promises etc. the event listener callbacks are asynchronous
- JavaScript files/code that run on a separate thread from the one loading your pages.
- Decoupled from your pages, you register a worker through a page, but after that they run in the background on a separate thread
- Have a scope (i.e. to your domain - this would mean that the worker can manage and have access to all pages on that domain)
- **Can Listen to and react to events**
  - Web Push Notifications - a push notification server sends out a notification and worker running in background can pick it up when app is closed
  - Notification Interactions - user interacts and service worker can listen for that and act on it - it is always running in background
  - `Fetch` events from JavaScript or HTML code causing browser to fetch assets and initiating a http fetch req (the worker functions as a network proxy)
    - **NOTE:** Using Ajax `xmlhttp` or thirdparty fetches with axios, etc will NOT trigger the event that a worker can listen to!
    - `fetch` events include links in the html `<head>` section or scripts fetched in the `<script>` tags as well as actual fetch calls using the `fetch` api in your JavaScript code
  - Background Sync - will run an operation that failed previously once a connection is established
  - Service Worker Life cycle events
- **NOTE** You must serve your app over https for service workers to work

  ## Registering a Service Worker and Lifecycle

  - Index.html loads the js file and lets the browser know that a js file is a service worker and the browser will register it as a background process
    - `install` event emitted. Browser will not install on reload if the file is unchanged and already loaded.
    - `activate` event emitted - will only be activated if an old service worker is not already running - need to close tab so browser can load the new version
      - **NOTE** During development, you can open the Application tab in dev tools and click `Skip waiting` to activate the worker immediately
    - Pending state while no operations are happening - the worker is taken out of this state when an event it handles occurs
    - Terminated state
  - **NOTE** - the service worker registration is the part that connects the service worker to the device browser. It can be accessed programmatically to do things like show push notifications, etc.

  ## Scope

  - By default the worker will only have a scope applying to pages inside the same folder the file is created.
  - Service Worker file is typically added in the `public` folder for scope to the full app
  - You can optionally add a scope option to the register worker function:

  ```javascript
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/folder" })
      .then(() => {
        console.log("service worker registered.");
      });
  }
  ```

## Registering a Service Worker

- Add the code to register a worker in a JavaScript file that is used by all the html pages you want the worker to manage (i.e. in your index.js file for ex)

## Responding to events

- Service workers are accessed in the sw.js file with the `self` keyword
- use `self.addEventListener()` to register listeners to the worker - in here you have access to special events (not DOM events, you do not have DOM access in a sw)

  - ex:

```javascript
self.addEventListener("install", function (event) {
  console.log("Service Worker, install");
});

self.addEventListener("activate", function (event) {
  console.log("Service Worker, activate");
  // you need this line to make activation more robust when it fails
  return self.clients.claim();
});
self.addEventListener("fetch", function (event) {
  // use event.respondWith() to intercept the request/response and modify it. If you pass in `null` then the response is overriden with nothing
  event.respondWith(fetch(event.request)); // this just passes the original request to fetch which returns a promise - respondWith expects a promise
});
```

- Note on `activate` event - activation will not occur if the app is already running in a tab during installation - you need to close and reopen the tab to activate the worker

### Other options

- Unregistering a service worker:

```javascript
navigator.serviceWorker.getRegistrations().then(function (registrations) {
  for (let registration of registrations) {
    registration.unregister();
  }
});
```

### Difference b/w Web Worker and Service Worker:

- Service Workers are a special type of Web Workers. Web Workers also run on a background thread, decoupled from the DOM. They don't keep on living after the page is closed though. The Service Worker on the other hand, keeps on running (depending on the operating system) and also is decoupled from an individual page.

### Deleting/Unregister a Service Worker

```javascript
// unregister a service worker
// the cache and worker will be gone when you reload the page again - if offline, cache is empty
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    registrations.forEach((reg) => {
      reg.unregister();
    });
  });
}
```

### Further Resources

- https://jakearchibald.com/2014/offline-cookbook/#cache-persistence
