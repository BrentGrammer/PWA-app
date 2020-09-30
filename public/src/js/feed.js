var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");
var form = document.querySelector("form");
var titleInput = document.querySelector("#title");
var locationInput = document.querySelector("#location");
var videoPlayer = document.querySelector("#player");
var canvasElement = document.querySelector("#canvas");
var captureButton = document.querySelector("#capture-btn");
var imagePicker = document.querySelector("#image-picker");
var imagePickerArea = document.querySelector("#pick-image");
var picture;

var locationBtn = document.querySelector("#location-btn");
var locationLoader = document.querySelector("#location-loader");
var fetchedLocation;

// Get user's location:
locationBtn.addEventListener("click", function (event) {
  // check if geolocation is supported first
  if (!("geolocation" in navigator)) {
    return;
  }

  // UI feedback, loader etc.
  locationBtn.style.display = "none";
  locationLoader.style.display = "block";

  // this will prompt the user for permission
  navigator.geolocation.getCurrentPosition(
    (position) => {
      locationBtn.style.display = "none";
      locationLoader.style.display = "none";
      // you have access to latitude and longitude coords (use them with Google's Geocoding API etc. if you want)
      fetchedLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      locationInput.value =
        "Use Google Geocoding API here to get address etc for display to the user";

      document.querySelector("#manual-location").classList.add("is-focused");
    },
    (err) => {
      console.error(err);
      locationBtn.style.display = "none";
      locationLoader.style.display = "block";
      alert("Problem fetching location.");
      fetchedLocation = { lat: null, lng: null };
    },
    {
      // time to get position and after it fails
      timeout: 7000,
    }
  );
});

// check if geolocation is supported:
function initializeLocation() {
  if (!("geolocation" in navigator)) {
    locationBtn.style.display = "none";
  }
}

// initialize the camera or the media feature depending on what the device supports
// Set a polyfill for navigator.getUserMedia if the browser is older or handle lack of support
// this allows you to use getUserMedia without different syntax for older implementations
function initializeMedia() {
  // mediaDevices is the API that gives us access to the device camera/microphone
  if (!("mediaDevices" in navigator)) {
    // if mediaDevices is not supported, then you can make a polyfill by adding it to the navigator object
    navigator.mediaDevices = {};
  }

  // if the browser does have mediaDevices, then it'll have getUserMedia. We can now implement our own polyfill
  if (!("getUserMedia" in navigator.mediaDevices)) {
    // there are older camera access implementations.  You now make your polyfill with constraints (constraints tell us, is it audio of video to capture?)
    navigator.mediaDevices.getUserMedia = function (constraints) {
      // some older browsers have their own implementations that already exist, which you can simply bind to the getUserMedia to use the new syntax in your app
      // safari uses a webkit implementation and older Mozilla browsers have their own as well
      var getUserMedia =
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      // if the browser has no older implementation, then the feature cannot be supported
      if (!getUserMedia) {
        // the modern getUserMedia returns a Promise, so keep this functionality
        return Promise.reject(new Error("getUserMedia is not implemented."));
      }

      return new Promise(function (resolve, reject) {
        // call getUserMedia setting `this` to the navigator, so you can call it like you would the modern getUserMedia on older browsers
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }

  captureButton.addEventListener("click", function (event) {
    // show canvas to capture a snapshot from the video stream
    canvasElement.style.display = "block";
    // hide the video player
    videoPlayer.style.display = "none";
    captureButton.style.display = "none";
    // store context for the canvas (context is where you intialize how you want to draw on the canvas)
    var context = canvasElement.getContext("2d");
    // this height for the image maintains the aspect ratio when entering it into the canvas:
    var canvasImageHeight =
      videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width);
    // draw the image from the video stream to the canvas
    // the first arg is the image element - use the videoplayer which will automatically give you the stream
    // the other args are the boundaries/dimensions of where to draw on the canvas (0,0 is xy for start top left and draw to bottom right, then you set the width and the height)
    context.drawImage(videoPlayer, 0, 0, canvas.width, canvasImageHeight);
    // You need to turn off the camera
    // get all running tracks off the video element and stop them all:
    videoPlayer.srcObject.getVideoTracks().forEach(function (track) {
      track.stop();
    });
    // the image in the canvas is a base64Url and we need a Blob/File to store in the backend - convert it with a util function
    // storing this to send with the FormData in sendData() function below
    // this is also stored in indexedDB in the 'sunmit' listener below for caching and background sync
    picture = dataURItoBlob(canvasElement.toDataURL());
  });

  // Fallback to use imagePicker
  imagePicker.addEventListener("change", function (event) {
    picture = event.target.files[0];
  });

  // getUserMedia takes a constraints object which you can set audio or video or both to true/false
  // Ex: { video: true, audio: true }
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      // Permissions will automatically ask user the first time you access the camera
      // if user declines permission prompt, then promise will reject and you handle it in the catch block

      // output the stream you get from getUserMedia promise
      // set the stream to the video player which is also set to autoplay so the user will see the live stream
      videoPlayer.srcObject = stream;
      // show the video player
      videoPlayer.style.display = "block";
    })
    .catch(function (err) {
      // if there is any error from getUserMedia, just show the fallback image file picker
      imagePickerArea.style.display = "block";
    });
}

function openCreatePostModal() {
  // animate section up
  createPostArea.style.transform = "translateY(0)";
  // set polyfill to access camera for older browsers and handle showing fallback if there is an error
  initializeMedia();
  initializeLocation();
  // check if there is the deferred prompt set in app.js - we want to show our install to homescreen banner when user clicks add button
  if (deferredPrompt) {
    // can only do this because chrome already prompted event for install to homescreen before this
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function (choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === "dismissed") {
        console.log("user cancelled install");
      } else {
        console.log("user added app to home screen");
      }
    });
    deferredPrompt = null; // can only prompt user one time, so unset the deferredprompt var in app.js

    // unregister a service worker example
    // the cache and worker will be gone when you reload the page again - if offline, cache is empty
    // if ("serviceWorker" in navigator) {
    //   navigator.serviceWorker.getRegistrations().then(function (registrations) {
    //     registrations.forEach((reg) => {
    //       reg.unregister();
    //     });
    //   });
    // }
  }
}

function closeCreatePostModal() {
  createPostArea.style.transform = "translateY(100vh)";
  // hide the video player and image file picker when closing
  imagePickerArea.style.display = "none";
  videoPlayer.style.display = "none";
  canvasElement.style.display = "none";
  locationBtn.style.display = "inline";
  locationLoader.style.display = "none";
}

// saves card information to cache when user clicks save
// i.e. useful method for saving assets on demand (i.e. an article a user wants to read later offline)
function onSaveButtonClick(event) {
  console.log("clicked");
  // check if caches api is supported by browser:
  if ("caches" in window) {
    caches.open("user-requested").then(function (cache) {
      // cache the boat image used in the card and the url for the request
      cache.add("https://httpbin.org/get");
      cache.add("/src/images/sf-boat.jpg"); // this is a static asset on our server so the url for our domain and server in the request is automatically prepended
    });
  }
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

// prevent duplicate cards being appended after data is fetched
function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  var cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = `url(${data.image})`;
  cardTitle.style.backgroundSize = "cover";
  cardTitle.style.height = "180px";
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = "center";
  // var cardSaveButton = document.createElement("button");
  // cardSaveButton.textContent = "Save";
  // cardSaveButton.addEventListener("click", onSaveButtonClick);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();

  data.forEach((d) => {
    createCard(d);
  });
}

/**
 * Cache first, then network strategy
 * Also see other piece in sw.js
 */
// used to prevent overwriting the network requested data with data from the cache if network is faster than cache retrieval
// set it to true once data is fetched
var networkReqComplete = false;

fetch("https://pwa-practice-app-289604.firebaseio.com/posts.json")
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    networkReqComplete = true;
    var dataArray = [];
    Object.keys(data).forEach((key) => dataArray.push(data[key]));
    updateUI(dataArray);
  });

// Part of Cache First, then Network strategy: Fetch from the cache while the network req is being made and create the card if network didn't finish first
// This is checking for the resource in the cache
if ("indexedDB" in window) {
  readAllData("posts").then(function (data) {
    // don't overwrite network fetch if it's complete
    if (!networkReqComplete) {
      console.log("data from indexedDB", data);
      updateUI(data);
    }
  });
}

// used as fallback if no service worker support in browser, just send data to network
// otherwise the sync event listener in the sw.js will send a request with this data
function sendData() {
  var id = new Date().toISOString();
  // since we are sending a file for the image now, we send FormData instead of just JSON
  var formData = new FormData();
  postData.append("id", id);
  postData.append("title", titleInput.value);
  postData.append("location", locationInput.value);
  postData.append("rawLocationLat", fetchedLocation.lat);
  postData.append("rawLocationLng", fetchedLocation.lng);
  postData.append("file", picture, id + ".png"); // you can overwrite the name of a file with the third argument.  You may also want to get the mime type to append instead of hardcoding png

  fetch(
    "https://us-central1-pwa-practice-app-289604.cloudfunctions.net/storePostData",
    {
      method: "POST",
      body: formData,
    }
  ).then(function (res) {
    updateUI();
  });
}

form.addEventListener("submit", function (event) {
  event.preventDefault();
  if (titleInput.value.trim() === "" || locationInput.value.trim() === "") {
    alert("please enter valid data.");
    return;
  }
  closeCreatePostModal();

  // Register background sync request
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    // check ready on service worker to make sure it is configured/installed and ready to take input
    navigator.serviceWorker.ready.then(function (sw) {
      var post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        picture: picture,
        rawLocation: fetchedLocation, // storing these vals in indexedDB
      };
      //store the data to send in a separate table in indexedDB
      writeData("sync-posts", post)
        .then(function () {
          // register the task and pass in an id tag for it
          // this tag will be referenced when the sync event is emitted in the sw
          return sw.sync.register("sync-new-posts");
        })
        .then(function () {
          var snackbarContainer = document.querySelector("#confirmation-toast");
          var data = { message: "Your post was saved for syncing." };
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        })
        .catch(function (err) {
          console.error(err);
        });
    });
  } else {
    // fallback if browser does not support service worker
    sendData();
  }
});
