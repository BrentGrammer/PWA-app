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
      // when you are granted permission show a confirmation notification
      displayConfirmNotification();
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
if ("Notification" in window) {
  enableNotificationsButtons.forEach((b) => {
    b.style.display = "inline-block";
    b.addEventListener("click", askForNotificationPermission);
  });
}
