const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

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
        response
          .status(201)
          .json({ message: "Data stored", id: request.body.id });
      })
      .catch((err) => {
        response.status(500).json({ error: err });
      });
  });
});
