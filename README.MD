# Progressive Web App - Learning project

Built following Maximilian Schwarzmüller's "Progressive Web Apps - Complete Guide" course on udemy.com.

**NOTE:**

- The code is heavily commented for reference. If you're learning about PWA you may find it useful.

- **Also, [see the `NOTES`](https://github.com/BrentGrammer/PWA-app/tree/master/NOTES) folder for a summary of various PWA concepts and strategies.**

# How to Use

You need [Node.js](https://nodejs.org) installed on your machine. Simply download the installer from [nodejs.org](https://nodejs.org) and go through the installation steps.

Once Node.js is installed, open your command prompt or terminal and **navigate into this project folder**. There, run `npm install` to install all required dependencies.

Finally, run `npm start` to start the development server and visit [localhost:8080](http://localhost:8080) to see the running application.

### Developing:

#### Updating Service Worker on Code Change

- **2 ways to refresh the service worker when changes are made in your code base:**
  - **EASIEST:** Go to `Application` -> `Clear Storage` -> `Clear site data` and refresh the page to load the new service worker
  - Update the version number in your service worker and refresh the browser, click on `skip waiting` and refresh and `activate` if given the option in Dev tools under `Application` -> `Service Workers`

### Hook up your device to chrome dev tools:

- (https://developers.google.com/web/tools/chrome-devtools/remote-debugging/)

  - Make sure USB Debugging is enabled on phone (in Android go to Developer Options)
  - To access, go to chrome://inspect/#devices
  - **Enable port forwarding** - click configure and check Enable Port Forwarding
  - Accept the Permissions Prompt on your phone
  - You can now go to http://localhost:<app-port> on your device to view app
  - You can click `inspect` button in Chrome developer tools after going to `More tools -> Remote devices`
  - On device, clear Site Settings by going to ellipses menu on top right corner and clicking the `i` information icon => `Site settings`, and then `Clear & reset` to clear the state for testing in development
  - Refresh the page on the device for a fresh start

### Note on Google Cloud Functions:

- Will be billed small charge for deploying using Node v10+
- For the moment, you could use Node 8 instead of Node 10 and you should be able to deploy without a credit card (and without being billed therefore).

- You set the Node version in the functions/package.json file (which will be created in the next lecture) like this:

  - Simply add that key-value pair to the functions/package.json file.
  - However, support for Node 8 will end on **February 15th 2021** -

```javascript
"engines": {"node": "8"}
```

### Troubleshooting

- `firebase init` to setup cloud functions, you may need to logout and login with `firebase logout` and `firebase login` before running `firebase init` if you get an error when trying to add to an existing project
