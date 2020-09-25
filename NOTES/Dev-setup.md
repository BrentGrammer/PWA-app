## In Development:

- Hook up your device to chrome dev tools: (https://developers.google.com/web/tools/chrome-devtools/remote-debugging/)

  - To access, go to chrome://inspect/#devices
  - **Enable port forwarding** - click configure and check Enable Port Forwarding
  - You can now go to http://localhost:<app-port> on your device to view app

- Chrome Tools: Under Network tab, set disable cache to true so you can test that the service worker is working and you're not using the browser cache.
- Make sure to disable browser caching/caching in your npm scripts or start script. Ex: `"start": "http-server -c-1"`

- Can check `Update on reload` option in network tools under Application tab which makes service workers activate during development so you don't have to open and reopen tabs to get that to happen. You can also just click `Skip waiting` in that tab as well to activate your worker.

### Polyfills

- It's a good idea to add polyfills to your project for `fetch` and `promise` for older browser support since a lot of the service worker code is asynchronous and uses promises and listens for events emitted using `fetch`

### Updating Service Worker on Code Change

- **2 ways to refresh the service worker when changes are made in your code base:**
  - Go to `Application` -> `Clear Storage` -> `Clear site data` and refresh the page to load the new service worker
  - Update the version number in your service worker and refresh the browser, click on `skip waiting` and refresh and `activate` if given the option in Dev tools under `Application` -> `Service Workers`

### Testing/Development

- To retest add to homescreen prompts, you need to click the upper right ellipses menu in the app on the device when you have it open in the device browser and select the `i` button -> site settings -> clear and reset, because chrome saves that the prompt was already answered, and you can't open it again after that.
- **When you update your javascript code, you either need to bump up a version recorded in your service worker file, or easier is go in dev tools to `Application`->`Clear Storage`->`Clear Site Data` and refresh the page.**
- When testing Background sync, you may need to actually completely disconnect your internet, not just check `offline` in devtools

### Icons

- See index.html for examples of link imports for apple touch icons etc.

### Responsive/Mobile feel Design

- You can set whether the user can zoom in with pinching the screen in the head section of index.html with `user-scalable=yes/no`:

```html
<meta
  name="viewport"
  content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
/>
```

### Mobile Responsive Design Resources:

- Responsive Design Basics by Google: https://developers.google.com/web/fundamentals/design-and-ui/responsive/
- Responsive Design Patterns (Google): https://developers.google.com/web/fundamentals/design-and-ui/responsive/patterns
- Responsive Images (Google): https://developers.google.com/web/fundamentals/design-and-ui/responsive/images
- Using CSS Media Queries: https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries
- Responsive Images (MDN): https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images
- Responsive Images in CSS: https://css-tricks.com/responsive-images-css/
- Using CSS Animations: http://learn.shayhowe.com/advanced-html-css/transitions-animations/
