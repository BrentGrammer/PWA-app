# Using Service Workers with SPA Applications

- [See this article for use of Workbox with React](https://medium.com/@chinmaya.cp/custom-service-worker-in-cra-create-react-app-3b401d24b875)
- [Excellent Simple Video on making a custom service worker file with Create-React-App](https://www.youtube.com/watch?v=9imIJfw8pLE)

- `serviceWorker.js` is a template file that comes with `Create-React-App`
  - It is NOT the service worker file, but contains register and unregister methods used to initialze the service worker
- Go to your `index.js` and register the service worker with `serviceWorker.register()`
  - NOTE: You need to create a production build to see and generate the new service worker: `npm run build`
  - You can use the `serve` npm package to serve the build folder: `npm i serve --save-dev` or `npm i -g serve` and then `serve -s build`, go to the localhost port where it is served
  - A generated service worker is generated in the `build` folder: `service-worker.js`
    - This is a generated file and you should not edit it directly.
- Create Your custom service worker code:
  - Create a `custom-service-worker.js` file in your `src` directory
  - In this file, write your service worker code using `self.addEventListener()` etc. here
- Modify your build script in `package.json` to append the contents of your custom service worker file to the generated `service-worker.js` file in the build folder:
  ```json
  "build": "react-scripts build && cat src/custom-service-worker.js >> build/service-worker.js"
  ```
  - Run another build: `npm run build`
  - Test the changes with `serve -s build`
  - Close your tab and open the app in a new tab

## Resources

create-react-app Page: https://github.com/facebookincubator/create-react-app
Angular CLI Github Page: https://github.com/angular/angular-cli
Overview over Angular Service Worker Usage: https://fluin.io/blog/angular-service-worker
PWAs with Angular: https://medium.com/@amcdnl/service-worker-pwas-with-the-angular-cli-98a8f16d62d6
Vue CLI PWA Template Page: https://github.com/vuejs-templates/pwa
More about sw-precache-webpack-plugin: https://www.npmjs.com/package/sw-precache-webpack-plugin
Important: If you DON'T want to replace sw-precache with Workbox but still want to add your own Service Worker logic, you have to use the importScripts[] option on the sw-precache config to import your own Service Worker file into the generated one. This allows you to add your own logic.
