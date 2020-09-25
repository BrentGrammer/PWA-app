# Progressive Web App - Learning project

Built following Maximilian Schwarzmüller's "Progressive Web Apps - Complete Guide" course on udemy.com.

**NOTE:**

- The code is heavily commented for reference. If you're learning about PWA you may find it useful.

- **Also, [see the `NOTES`](https://github.com/BrentGrammer/PWA---Learning-Project/tree/master/NOTES) folder for a summary of various PWA concepts and strategies.**

# How to Use

You need [Node.js](https://nodejs.org) installed on your machine. Simply download the installer from [nodejs.org](https://nodejs.org) and go through the installation steps.

Once Node.js is installed, open your command prompt or terminal and **navigate into this project folder**. There, run `npm install` to install all required dependencies.

Finally, run `npm start` to start the development server and visit [localhost:8080](http://localhost:8080) to see the running application.

### Developing:

#### Updating Service Worker on Code Change

- **2 ways to refresh the service worker when changes are made in your code base:**
  - **EASIEST:** Go to `Application` -> `Clear Storage` -> `Clear site data` and refresh the page to load the new service worker
  - Update the version number in your service worker and refresh the browser, click on `skip waiting` and refresh and `activate` if given the option in Dev tools under `Application` -> `Service Workers`

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
