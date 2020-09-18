# Push Notifications

- Server pushes information to the app
- The user is shown a notification on their device
- Browser Support is decent, though IE is not supported
  - If the feature is not supported, then the notification will simply not be shown and it will not crash the app with an appropriate check

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
