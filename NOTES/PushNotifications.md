# Push Notifications

- Server pushes information to the app
- The user is shown a notification on their device
- Browser Support is decent, though IE is not supported
  - If the feature is not supported, then the notification will simply not be shown and it will not crash the app with an appropriate check
- Uses the [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/notification) that comes with numerous modern browsers
- You actually show the push notifications on the client with the Service Worker Registration (this is the part that connects the service worker to the browser)

### Process

- Enable notifications on device - user must be requested to grant permission to use notifications
- Push notifications are sent from servers on Browser Vendor Push servers:
  - Google/Mozilla, etc. own their own servers that send push notifications
- Push notifications are sent to devices/browsers that have **subscriptions** to the notification service.
  - **Subscriptions are per device/browser/service worker combination**
    - If you subscribe to notifications on Chrome/Device-A, and also on Firefox/Device-A, then that is two separate subscriptions
    - If you unregister a service worker and install/reg/activate a new version, all subscriptions for the previous worker are now invalid - each service worker generates it's own subscriptions
  - subscription is managed by the browser and you use the service worker to work with subscriptions
    - The service worker sends a subscription to the backend server to store it there where it will be used by the backend to push messages to the client app
    - You need a backend server to run your own code
    - Subscription holds information about the push server endpoint and authentication info
- The backend server sends a push notification to the Broser Vendor Push server using an endpoint assoc with the subscription
- **Browser Vendor Push server then delivers the notification to the app via the service worker in a triggered `push` event**

**NOTE: You can display a notification whenever you want anywhere in your app and technically do not need to wait for a `push` event.**
(You can simply using the `Notification API` via your JavaScript code if you want. Service Workers are necessary when dealing with Push Notifications, however.)

## Setting up Push Notifications

### Requesting Permissions

- You can have an `Enable Notifications` button in your app to trigger the permissions request
- First check to see if Notifications are supported by the browser (don't show the buttons if they are not):
  ```javascript
  if ("Notification" in window) {
    enableNotificationsButtons.forEach((b) => {
      b.style.display = "inline-block";
      b.addEventListener("click", askForNotificationPermission);
    });
  }
  ```
- Prompt the user for permission using the `Notifications` API.
  - NOTE: If the user accepts permission for `Notifications`, you automatically get permissions for `Push` as well.
  - calling `new Notification('...')` actually displays a system notification for the user's device
  ```javascript
    Notification.requestPermission((result) => {
      console.log("user choice", result);
      if (result !== "granted") {
        // if user blocks Notifications, you cannot ask again.
        // if undecided (closed tab, etc.) prompt will come up again next time
        console.log("permission denied.");
      } else {
        // when you are granted permission show a confirmation notification
        new Notification("Successfully Subscribed!");
      }
    });
  }
  ```

### Showing Notifications via the Service Worker

- You can access the _Service Worker Registration_ which allows you to manage Notifications via the Service Worker any where in your code by checking the `.ready` property:

```javascript
if ("serviceWorker" in navigator) {
  var options = {
    body: "You subscribed to notifications. Yay!",
  };
  navigator.serviceWorker.ready.then((swregistration) => {
    // the sw registration is not only the service worker, but extra functionality you can use to handle notifications
    // we can access the service worker interface to notifications
    // this takes the same args as the new Notification constructor - a title and options
    swregistration.showNotification(
      "Successfully Subscribed (from SW!)",
      options
    );
  });
}
```

### Notifications Options

- `body`: specify a string to display under the title of the notification
- `icon`: points to a url for an icon to display next to the notification. 96x96 is a nice size for an image icon to show.
- `image`: point to a url for the image. This will show up in the body of the notification as opposed to the left or right like the `icon` would. i.e. it would be a big image in the middle of the notification.
- `dir`: 'ltr' or 'rtl'. direction of the text 'ltr' is the default.
- `lang`: accepts a BCP 47 language code - google these codes. ex: 'en-US'
- `vibrate`: takes an array of millisecond numbers for the vibration pattern. Not supported on all devices/browsers. Pattern is <vibrateInMs>/<pauseInMs>/<vibrateInMs>. Ex: [100,50,200]
- `badge`: takes a url to a icon to show in the top bar:
  ```javascript
  badge: "/src/images/icons/app-icon-96x96.png", // shows in the top bar - may only apply to Android.  Android automatically masks this icon for you and 96x96 is the recommended size
  ```
- `tag`: accepts a string to tag the notification. Acts like an Id for the notification. If you send other notifications with the same tag, they will stack on top of each other instead of displaying beneath each other. i.e. the latest notification with the same tag will replace the previous one.
  - Note: some operating systems do not allow more than one notification at a time, but if they allow multiple notifications at a time this can be useful to only display one of those with the same tag.
- `renotify`: accepts bool true/false. new notification with same tag still vibrates and notifies user
- `actions`: takes an array where you can specify multiple actions. Each action is an object.

  - **You should not rely on these being displayed for the user to tap on. It depends on the device and system. It's safer to simply rely on a user tapping on the notification without having the option for different actions.**
  - Ex:

    ```javascript
    actions: [
        {
          action: "confirm", // action id
          title: "Okay", // what user sees to click on - btn title
          icon: "/src/images/icons/app-icon-96x96.png", // icon to use
        },
        {
          action: "cancel",
          title: "Cancel",
          icon: "/src/images/icons/app-icon-96x96.png",
        },
      ],
    ```

    - **Reacting to action clicks** happens in the service worker code because the Notification is not part of the web application - it is a system notification that the user can interact with when our app isn't even open. The sw is a background process that will still be running and listening for these interactions.
    - Listen for a `notificationclick` event in the service worker:

    ```javascript
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
    ```

### Listening for the Close Notification event

- Happens when user swipes the notification away or clicks the `X`
- Logic done in Service worker on the event `notificationclose`
- Good place to poss. send analytics data to your server (maybe store timestamp of notification and analyze why users may not have interacted with it)

```javascript
self.addEventListener("notificationclose", function (event) {
  console.log("notification closed.");
});
```

## Push Notifications

- Store subscriptions on a server which is used to send notifications to subscribers (Browser/Devices subscribed)
- Subscriptions are per browser/device combination and are also associated with a specific service worker (if a new service worker is installed, this renders the previous subscription useless)
  - This does not apply if there is only a code change and the service worker is not uninstalled - (i.e. if you clear site data)
  - **Key Takeaway: If you unregister you service worker, then you need to clear that subscription from the database**

### Creating a Subscription

- Done on the front end, for instance where the user clicks the button to enable notifications
- A subscription contains an endpoint for the browser vendor server to which you push your messages to. (that server forwards them to our web app)
  - **SECURITY RISK**: If anyone finds out what your endpoint is, they can send messages that will look like they're coming from you.
  - You need to specify that push messages must only come from your backend server
    - Passing an IP address for your server is not enough - someone can fake that and it is not secure
    - Use **VAPID** keys, an approach which involves using 2 keys - a public and private key. The private key is connectected to the public one but cannot be derived from it. It is stored on your server
  - Install the `web-push` npm package (`npm i web-push`) into your back end server dependencies (not the client app) and use it to generate these VAPID keys and manage sending push notifications
- **Each browser/device/service worker combination yields one subscription if subscribed**. If you open up a new browser on the same device, then that is a separate service worker registration and a separate subscription. Also, _If the service worker is unregistered or removed from the browser, then that subscription no longer applies - you need to remove it from the backend in that case_

### Generating VAPID keys for Push Notification Security:

After installing the `web-push` npm package to your backend dependencies, setup a new script in your `package.json` to start the package script.

```json
  "scripts": {
    //...
    "web-push": "web-push"
  },
```

Now generate the keys with `npm run web-push generate-vapid-keys`

- **You only run this once during development.**

## Front End Setup

- Use the public key generated in the terminal in your client app where you create the subscription for push notifications

  - **NOTE** The configuration passed into subscribe() is expecting a `Uint8Array`, so you need a utility to convert the vapid key string into that type:

  ```javascript
  function urlBase64ToUint8Array(base64String) {
    var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
  ```

- In your Client App, pass the Converted Vapid key into a config options to `.subscribe()` on the service worker registration where you craete the subscription:
- Store the subscription in the database, and you will use the keys that are stored there when sending push notifications

```javascript
function configurePushSub() {
  // check if browser supports service workers:
  if (!("serviceWorker" in navigator)) return;
  // save in outer scope to access lower in promise chain
  var reg;

  navigator.serviceWorker.ready
    .then(function (swregistration) {
      reg = swregistration;
      // access push manager and check for existing subscriptions
      return swregistration.pushManager.getSubscription(); //returns promise
    })
    .then(function (sub) {
      // subscription will be null if none exist
      // Note a subscription is per browser/device combo - if another browser on same device is opened, that would be a separate subscription
      // check if this browser/device combo has a subscription:
      if (sub === null) {
        // use the npm package web-push installed in your backend to generate a public and private key used to secure push notifications are only sent from your server
        var vapidPublicKey =
          "BK_ufyz0UY3B4ZPARoKIkCsCaY3bTfjkkOtVsJkV2vfTNOmdN_2gI63WRbhqA1tHEV6xKGicX4LV19gI-3ckLUA";
        // you need to convert the key to a Uint8Array which the subscribe method is expecting - use a utility function
        var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);

        // create a new subscription - this creates a new one or overwrites the old existing one if it exists
        // If anyone finds out what your endpoint is, they can send messages that will look like they're coming from you.
        // you need to pass in configuration to secure your endpoint
        return reg.pushManager.subscribe({
          userVisibleOnly: true, // messages sent are only visible to this user
          applicationServerKey: convertedVapidPublicKey,
        });
      } else {
        // use existing subscription
      }
    })
    .then(function (newSub) {
      // returned a new subscription to store in your backend (database)
      // this creates a subscriptions node if it doesn't exist in firebase
      return fetch(
        "https://pwa-practice-app-289604.firebaseio.com/subscriptions.json",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(newSub),
        }
      );
    })
    .then(function (response) {
      if (response.ok) displayConfirmNotification();
    })
    .catch(function (err) {
      console.error(err);
    });
}
```

### Listening for Push Notifications

- Listen to messages in the Service Worker (it's always running in background most devices)
- Listen to a `push` event

Ex in your service worker .js file:

```javascript
self.addEventListener("push", function (event) {
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
```

## Backend Setup

- On your server app, where you want to send push notifications, use the web-push package installed to send push notifications.
- Pass in and use your public/private vapid keys generated with the package and fetch your subscriptions stored in your database
- For each subscription, use the web-push send command
- You can send a payload with the notification with data you use to display to the user. Note that there is a size limit and probably can't send images, but you can send urls etc.
  - Usually you just send a title, text content, and maybe a link to an image

Ex:

```javascript
exports.storePostData = functions.https.onRequest((request, response) => {
  return cors(request, response, function () {
   databaseStuff
      .then(() => {
        // add vapid key security for push notifications (ensures they only come from your server to users)
        // pass identifier of self(email addr), the vapid public key, and the private vapid key (generated with npm package)
        webpush.setVapidDetails(
          "mailto:myemail@email.com",
          KEYS.publicVapidKey,
          KEYS.secretVapidKey
        );
        // fetch subscriptions to send push notifications to
        return admin.database().ref("subscriptions").once("value"); // get value of the node once in fb
      })
      .then((subscriptions) => {
        subscriptions.forEach((sub) => {
          // config sent to web push
          const pushConfig = {
            endpoint: sub.val().endpoint, // the endpoint for the browser vendor server
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh,
            },
          };

          // send push notification for each subscription
          // the second arg is a payload you send with the push notification (can be anything you want)
          // returns a promise, just catch and handle errors
          webpush
            .sendNotification(
              pushConfig,
              JSON.stringify({ title: "New post", content: "New Post added" })
            )
            .catch((err) => {
              console.error(err);
            });
        });
```
