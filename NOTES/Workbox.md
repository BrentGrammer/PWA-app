# WORKBOX

- Tool by Google for automatic service worker management
- Can use it with Gulp/Webpack various project setups or just the cli with straight scripts
- [DOCS](https://developers.google.com/web/tools/workbox/modules/workbox-cli)

## Setup

- Install as a dev dependency: `npm install --save-dev workbox-cli` for v2
  - v3 is the latest as of this date
- write an npm script in `package.json` to use it to generate a service worker:
  - `"generate-sw": "workbox wizard && workbox generateSW workbox-config.js"`
    - \*\*\* Note: File name must be matched. If you had changedworkbox-config.js" to something else, please replace with your file name.
  - `"update-sw": "workbox generateSW workbox-config.js"`
    - run this when you make a change to the config file or service worker in development
  - run the script `npm run generate-sw`
    - choose the root of the web app when prompted (where index.html is served)
    - Follow prompts (can store everything to start with)
    - Troubleshooting: if you get a require error on generating the config file, do not enter `Y` to the later prompts, just press `enter` to save config when prompted.
- Where you register your service worker and point to the file, make sure the path points to the generated sw you made with the workbox-cli:

```javascript
navigator.serviceWorker.register("/service-worker.js");
```

### Workbox basic config file:

```javascript
module.exports = {
  globDirectory: "public/", // where do files to cache live
  globPatterns: [
    "**/*.{html,ico,json,css,png,jpg,js}", // any folder in public, any file name with any of these extensions should get cached.  Paths here are relative to the globDirectory defined above
  ],
  swDest: "public/service-worker.js", // where is the service worker file
  globIgnores: ["../workbox-config.js", "help/**"], // do not cache these files
};
```

(After changing this config anytime, run `workbox generateSW workbox-config.js` or make a script for it)

## Features

- Will automatically update the version if you run the generate command with Workbox-cli for development
- Puts all files specified in the config into the cache on install
-

## Development

- When you make changes to the service-worker or config file, run the script that runs `workbox generateSW workbox-config.js` (make an npm script for it)
  - generates a new service worker and overwrites the old one
