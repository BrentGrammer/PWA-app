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
function sendData() {
  fetch(
    "https://us-central1-pwa-practice-app-289604.cloudfunctions.net/storePostData",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        image: "image url",
      }),
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
        image: "image-url",
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
