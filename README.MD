# Progressive Web App - Learning project

Built following Maximilian Schwarzmüller's "Progressive Web Apps - Complete Guide" course on udemy.com.

**NOTE:**

- The code is heavily commented for reference. If you're learning about PWA you may find it useful.

- **Also, [see the `NOTES`](https://github.com/BrentGrammer/PWA-app/tree/master/NOTES) folder for a summary of various PWA concepts and strategies.**

# How to Use

### Pre-requisites

- You need [Node.js](https://nodejs.org) from [nodejs.org](https://nodejs.org)
- `secrets.js` for push notifications to work (private file)

### Running the app in development:

- run `npm install` to install all required dependencies.
- run `npm start` to start the development server and visit [localhost:8080](http://localhost:8080)

## Developing:

### Updating Service Worker on Code Change

- **If you change code outside of your service worker, but not the service worker code, then you need to keep a version that you bump to trigger a reinstallation of the sw (i.e. in a const string)**
- **3 ways to refresh the service worker when changes are made in your code base:**
  - Go to `Application` -> `Clear Storage` -> `Clear site data` and refresh the page to load the new service worker. Note this will clear any subscriptions you have setup on the sw like for push notifications.
  - If code outside your service worker is changed: Update the version number in your service worker and refresh the browser, click on `skip waiting` and refresh and `activate` if given the option in Dev tools under `Application` -> `Service Workers`. You may need to refresh, close and re-open the tab
  - If only Service Worker code is changed: Refresh the page to update the service worker code, and close the tab of your app. Then re-open a new one. Use this approach if you want to test something that requires you keep the same service worker around - i.e. if you're testing push notifications and need to retain the subscriptions for the sw.

### Hook up your device to chrome dev tools:

- (https://developers.google.com/web/tools/chrome-devtools/remote-debugging/)

  - Make sure USB Debugging is enabled on phone (in Android go to Developer Options)
  - To access, go to chrome://inspect/#devices
  - **Enable port forwarding** - click configure and check Enable Port Forwarding
  - Accept the Permissions Prompt on your phone
  - You can now go to http://localhost:<app-port> on your device to view app
  - You can click `inspect` button in Chrome developer tools after going to `More tools -> Remote devices` to see device in browser
  - On your android device, clear Site Settings by going to ellipses menu on top right corner and clicking the `i` information icon => `Site settings`, and then `Clear & reset` and refresh the page to clear the state for testing in development

### Note on Google Cloud Functions:

- Will be billed small charge for deploying using Node v10+
- For the moment, you could use Node 8 instead of Node 10 and you should be able to deploy without a credit card (and without being billed therefore).

- You set the Node version in the functions/package.json file (which will be created in the next lecture) like this:

  - Simply add that key-value pair to the functions/package.json file.
  - However, support for Node 8 will end on **February 15th 2021** -

```javascript
"engines": {"node": "8"}
```

#### Making Changes to functions code:

- After making your changes, run `firebase deploy` in the cli

## Generating VAPID keys for Push Notification Security:

After installing the `web-push` npm package to your backend dependencies (i.e. in the `functions` folder package.json), setup a new script in your `package.json` to start the package script.

```json
  "scripts": {
    //...
    "web-push": "web-push"
  },
```

Now generate the keys with `npm run web-push generate-vapid-keys`

(NOTE: The keys are stored in the `secrets.js` file in `/functions`. This is not checked in and if lost/newly pulled from repo, will need to be created again)

- **You only run this once during development.**

- Use the public key generated in the terminal in your client app where you create the subscription for push notifications

  - **NOTE** The configuration passed into subscribe() is expecting a `Uint8Array`, so you need a utility to convert the vapid key string into that type:

  ```javascript
  function urlBase64ToUint8Array(base64String) {
    var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
  ```

## Troubleshooting

- `firebase init` to setup cloud functions, you may need to logout and login with `firebase logout` and `firebase login` before running `firebase init` if you get an error when trying to add to an existing project
- CORS errors for requests: Check the firebase function logs for possible cause - the issue may not be related to CORS and could be misleading.
  - Sometimes can be caused by no billing setup for the project for example.

## Packages

- `busboy` - to read parsed form data from firebase on backend from a buffer
- `@google-cloud/storage`: Allows you to save files to google cloud storage on the backend
- `uuid-v4` - used to generate a public url to download file uploads from google cloud storage on the server
- Workbox-cli - manage service workers, tool by google `npm install --save-dev workbox-cli`

  - [see post for updated setup](https://www.udemy.com/course/progressive-web-app-pwa-the-complete-guide/learn/lecture/7867598#questions/12596996)

  ## Workbox

  - The app uses Dynamic caching/routing via Workbox
  - `npm run injectManifest` whenever you make changes to `sw-base.js`
