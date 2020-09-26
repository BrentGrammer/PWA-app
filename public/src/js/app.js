/**
 * Registering a worker - this file is imported by all the html pages and so they will be managed by it
 */

var enableNotificationsButtons = document.querySelectorAll(
  ".enable-notifications"
);

// Polyfills fetch.js and promise.js added to proj for old browser support of fetching (add these in script tags before app.js in html files)
if (window.Promise) {
  window.Promise = Promise; // Promise provided by promise.js
}

// Make sure the browser supports service workers:
// the property serviceWorker will exist in the browser navigator obj
if ("serviceWorker" in navigator) {
  // tell the browser where the worker js file is and it will set it up as a background process.  Register returns a promise
  navigator.serviceWorker
    .register("/sw.js")
    .then(() => {
      console.log("service worker registered.");
    })
    .catch(function (err) {
      console.error(err);
    });
}

var deferredPrompt;
// defer showing the install to homescreen prompt, for example after a user clicks on a button
// NOTE: - To retest add to homescreen prompts, you need to click the upper right ellipses menu in the app on the device when you have it open in the device browser and select the `i` button -> site settings -> clear and reset, because chrome saves that the prompt was already answered, and you can't open it again after that.
window.addEventListener("beforeinstallprompt", function (event) {
  console.log("beforeinstallprompt fired");
  event.preventDefault();
  deferredprompt = event;
  return false; // don't do anything upon the event
});

// set up a subscription to use for push notifications which is done when user clicks the Enable Notifications button
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
          "BBq2LFlh9tntYdZA-XtAt7CnOa7Zx4STdM8AV5y8p-vxOf0NfvntuTuM_E-NHRksH-915tFcVai407a-Gp-VVdY";
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
      // NOTE: If you unregister you service worker, then you need to clear that subscription from the database
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

// this prompts the user for permission
function askForNotificationPermission() {
  // Note that you also automatically get Push Permissions with Notification Permissions
  Notification.requestPermission((result) => {
    console.log("user choice", result);
    if (result !== "granted") {
      // if user blocks Notifications, you cannot ask again.
      // if undecided (closed tab, etc.) prompt will come up again next time
      console.log("permission denied.");
    } else {
      // when you are granted permission show a confirmation notification/setup a subscription to send to your server
      //displayConfirmNotification();
      configurePushSub();
    }
  });
}

function displayConfirmNotification() {
  // handle notifications with the service worker if supported
  if ("serviceWorker" in navigator) {
    var options = {
      body: "You subscribed to notifications. Yay!",
      icon: "/src/images/icons/app-icon-96x96.png", // 96x96 is a nice size to use
      image: "/src/images/sf-boat.jpg",
      dir: "ltr",
      lang: "en-US",
      vibrate: [100, 50, 200], // vibrate pattern, vibrate/pause/vibrate pattern in milliseconds
      badge: "/src/images/icons/app-icon-96x96.png", // shows in the top toolbar - may only apply to Android.  Android automatically masks this icon for you and 96x96 is the recommended size
      tag: "confirm-notification", // other notifications with same tag will be overwritten with subsequent notifications with the same tag so multiple notifications with the same tag will only show the latest
      renotify: true, // new notification with same tag still vibrates and notifies user
      actions: [
        // these actions are handled in the service worker on a 'notificationclick' event
        {
          action: "confirm",
          title: "Okay",
          icon: "/src/images/icons/app-icon-96x96.png",
        },
        {
          action: "cancel",
          title: "Cancel",
          icon: "/src/images/icons/app-icon-96x96.png",
        },
      ],
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
}

// only show the enable notifications buttons if it is supported in the browser
// serviceworker is checked to use push notifications if you're using that
if ("Notification" in window && "serviceWorker" in navigator) {
  enableNotificationsButtons.forEach((b) => {
    b.style.display = "inline-block";
    b.addEventListener("click", askForNotificationPermission);
  });
}
