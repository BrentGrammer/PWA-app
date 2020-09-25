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

NOTE: You can display a notification whenever you want in your app and technically do not need to wait for a `push` event simply using the `Notification API` via your JavaScript code if you want. Service Workers are necessary when dealing with Push Notifications, however.

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
