## App Manifest

- Allows user to install to home screen.

## Browser Compatibility:

- Resources:

  - Web App Manifest - Browser Support: http://caniuse.com/#feat=web-app-manifest
  - MDN Article on the Web App Manifest (includes List of all Properties): https://developer.mozilla.org/en-US/docs/Web/Manifest
  - A detailed Web App Manifest Explanation by Google: https://developers.google.com/web/fundamentals/engage-and-retain/web-app-manifest/
  - More about the "Web App Install Banner" (including Requirements): https://developers.google.com/web/fundamentals/engage-and-retain/app-install-banners/

- Chrome, and IE Edge/Firefox
- #### SAFARI:
  - Need to add meta tags to the html file in the head section for safari support (not full support, but close):
  ```html
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black" />
  <meta name="apple-mobile-web-app-title" content="PWAGram" />
  <link
    rel="apple-touch-icon"
    href="/src/images/icons/apple-icon-57x57.png"
    sizes="57x57"
  />
  <link
    rel="apple-touch-icon"
    href="/src/images/icons/apple-icon-60x60.png"
    sizes="60x60"
  />
  <link
    rel="apple-touch-icon"
    href="/src/images/icons/apple-icon-72x72.png"
    sizes="72x72"
  />
  <link
    rel="apple-touch-icon"
    href="/src/images/icons/apple-icon-76x76.png"
    sizes="76x76"
  />
  <link
    rel="apple-touch-icon"
    href="/src/images/icons/apple-icon-114x114.png"
    sizes="114x114"
  />
  <link
    rel="apple-touch-icon"
    href="/src/images/icons/apple-icon-120x120.png"
    sizes="120x120"
  />
  <link
    rel="apple-touch-icon"
    href="/src/images/icons/apple-icon-144x144.png"
    sizes="144x144"
  />
  <link
    rel="apple-touch-icon"
    href="/src/images/icons/apple-icon-152x152.png"
    sizes="152x152"
  />
  <link
    rel="apple-touch-icon"
    href="/src/images/icons/apple-icon-180x180.png"
    sizes="180x180"
  />
  ```
  - #### IE Explorer and fallback meta tags:
  ```html
  <meta
    name="msapplication-TileImage"
    content="/src/images/icons/app-icon-144x144.png"
  />
  <meta name="msapplication-TileColor" content="#fff" />
  <meta name="theme-color" content="#3f51b5" />
  ```

## Installation on Home Screen:

- go to site on device and pull down ellipsis menu in top right and click add to homescreen
- If certain criteria are met, a prompt will be given to the user after some time: see [Latest Requirements](https://developers.google.com/web/fundamentals/app-install-banners/native#criteria)

## Creating App Manifest:

- add a `manifest.json` file to the root web folder (i.e. /public where the index.html is)
- link to the manifest in your index.html with `<link rel="manifest" href="/manifest.json" />` in the head.

  - NOTE: in a SPA, you only add this link to the index.html, but in a multi page app, you need to add it to every html page in the head section!

- ### Properties of a Manifest.json file:
  - `name`: The long name of the app that will be displayed on the splash screen
  - `short_name`: The name shown below the app icon on the home screen
  - `start_url`: Which page is loaded on start up when the app is tapped
  - `scope`: Which part of the application is using the manifest/PWA config. Common to set the whole app with `"."`
  - `display`: How the app looks when loaded. Default is `"standalone"` which makes the app look like a native app (i.e. not in a browser)
  - `background_color`: specifies color of background of splash screen when loading, takes a hexadecimal color value
  - `theme_color`: the color of the top task bar in the app
  - `description`: used by browser and seen by user in favorites for ex
  - `dir`: direction of reading: ex left to right is `"ltr"`
  - `lang`: `"en-US"`
  - `orientation`: force orientation on app load, ex: `"portrait-primary"`
  - `icons`: array of icons the app will choose automatically the best one for the screen size, etc.
  - `related_applications`: related native apps for the user, for ex. a native version of the PWA on the play store.
