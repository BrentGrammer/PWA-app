# Accessing the Device Camera

- `navigator.mediaDevices` is the API that gives the access to the device camera and microphone. (all media the device can generate, audio and video/images)
  - Use the `MediaDevices.getUserMedia()` method - generally good support except for IE
  - (See Docs for Supported Browsers/Devices)[https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices]
- Stream a live picture of the device camera to an HTML5 `<video>` element.
- You can use a HTML5 `<canvas>` to capture a still image. It automatically holds the latest snapshot image from a video stream sent to it
- close the `<video>` player when done.

- **Note:** on a device such as an IOs phone, for example, if you have a standard file picker set to accept `"image/*"`, then the device may offer the user the option of leaving the app and taking a picture as well as choosing from their library.
- The purpose of using the HTML5 video and canvas elements is to embed this experience in the web app, so the user does not have to leave the app.

  - the video element is used to allow the user to adjust their camera for a good picture
  - the canvas element is involved in drawing the picture from the video stream

- can use HTML5 video and canvas elements for input:

```html
<video id="player" autoplay></video>
<canvas id="canvas" width="320px" height="240px"></canvas>
<button
  class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored"
  id="capture-btn"
>
  Capture
</button>
```

- For devices that don't have a camera, you can conditionally use a fallback file picker:

```html
<div id="pick-image">
  <h6>Pick an Image instead</h6>
  <input type="file" accept="image/*" id="image-picker" />
</div>
```

## MediaDevices API

- The `navigator.mediaDevices.getUserMedia()` method is how you access camera/audio on devices

### Setting up a polyfill for older browsers:

- Older Safari and Mozilla browsers have an older API for accessing camera and audio devices.

  - Create a polyfill that uses their older implementations and attaches it to the modern `getUserMedia` function on the `navigator` object:

  ```javascript
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
  ```

  ### Getting Access to the Camera:

- The `getUserMedia()` takes a constraints argument which specifies what kind of media devices you want to access and returns a promise:
  - `video` or `audio`
  - Set these to `true/false` - You don't have to set both - they default to `false`
  - The `getUserMedia` method returns a promise with access to a stream of the media coming from the device
- **Permissions**: The first time you access media devices, the user will be prompted automatically for permission - if they decline, then the promise returned from `getUserMedia` rejects and you handle it in the catch block. If permission is granted, they will not be asked again.

**On the page or where in your app you want to show the camera stream and after your polyfill has been initialized, call `getUserMedia` directly on the `navigator` object:**

```javascript
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
```

### Capturing an Image from the stream to a Canvas element:

- Where your take picture button is, on that click handler, send the snapshot of the video player stream to the canvas and draw it
- Convert the image from the canvas from a `base64Url` to a `BLOB` file to send to the backend to store.

```javascript
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
```

### Turn off the Camera

- Make sure that the camera does not keep running or streaming when you are done capturing the picture:

```javascript
// turn off the camera - check the srcObject on the video element which is only set if there is a stream
if (videoPlayer.srcObject) {
  // stop all tracks
  videoPlayer.srcObject.getVideoTracks().forEach((track) => track.stop());
}
```

### Storing the image on the backend

- When you capture the image in the canvas, it exists as a base64Url
- You need to convert it to a BLOB (File) on the front end (i.e. send with FormData) to store on your server (avoid storing long big base64 strings in your database)
  - You can use Firebase Storage or Amazon AWS S3 etc.
  - Use a utility to convert the base64Url to a BLOB:
  ```javascript
  function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(",")[1]);
    var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ab], { type: mimeString });
    return blob;
  }
  ```
- Store the picture and data sent to backend in indexedDB for background sync tasks if offline:

```javascript
form.addEventListener("submit", function (event) {
  event.preventDefault();
  // ... form validation

  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then(function (sw) {
      var post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        picture: picture, // this is converted to a BLOB before this point using the utility mentioned above
      };
      //store the data to send in indexedDB
      writeData("sync-posts", post)
        .then(function () {
          return sw.sync.register("sync-new-posts");
        })
        .then(function () {
          //...ui feedback on complete action
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
```
