# Push Notifications

- Server pushes information to the app
- The user is shown a notification on their device
- Browser Support is decent, though IE is not supported
  - If the feature is not supported, then the notification will simply not be shown and it will not crash the app with an appropriate check
- Uses the [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/notification) that comes with numerous modern browsers

### Process

- Enable notifications on device - user must be requested to grant permission to use notifications
- Push notifications are sent from servers on Browser Vendor Push servers:
  - Google/Mozilla, etc. own their own servers that send push notifications
- Push notifications are sent to devices/browsers that have **subscriptions** to the notification service.
  - Subscriptions are per device/browser combination
    - If you subscribe to notifications on Chrome/Device-A, and also on Firefox/Device-A, then that is two separate subscriptions
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
