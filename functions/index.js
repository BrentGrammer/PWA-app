const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
// use web-push package for push notifications
const webpush = require("web-push");
// gitignored secrets:
const KEYS = require("./secrets");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
var serviceAccount = require("./pwagram-fb-key.json");
//initialize app - go to firebase console for database url and credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pwa-practice-app-289604.firebaseio.com/",
});
exports.storePostData = functions.https.onRequest((request, response) => {
  // wrap the response with cors to automatically send the right headers etc. for cross origin access
  return cors(request, response, function () {
    console.log("ID", request.body.id);
    response.set("Access-Control-Allow-Origin", "*");
    admin
      .database()
      .ref("posts")
      .push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image,
      })
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
            endpoint: sub.val().endpoint, // the endpoint for the browser vendor server stored in the subscription in the database
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh,
            },
          };
          // sned push notification for each subscription
          // the second arg is a payload you send with the push notification
          // (the payload is used by the front end.  Pass whatever you want, this is not predefined). NOTE: there is a limit to the size of data you can send - images may be too big
          // returns a promise, just catch and handle errors
          webpush
            .sendNotification(
              pushConfig,
              JSON.stringify({
                title: "New post",
                content: "New Post added",
                openUrl: "/help", // used to tell front end what page to open when notification is clicked - this is absolute from the server/domain, can be any url
              })
            )
            .catch((err) => {
              console.error(err);
            });
        });

        response
          .status(201)
          .json({ message: "Data stored", id: request.body.id });
      })
      .catch((err) => {
        response.status(500).json({ error: err });
      });
  });
});
