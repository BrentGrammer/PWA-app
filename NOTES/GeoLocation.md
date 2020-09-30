# GEOLOCATION

- Very well supported by browsers
  - [See MDN](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- Use the `navigator.geolocation` API:
  - `navigator.geolocation.getCurrentPosition()`: prompts user for location permissions and gets location
    - 1st arg is success callback
    - 2nd arg is error callback handler
    - 3rd arg is a config object (i.e. set the `timeout` here)
    - Coordinates on `position.coords.latitude`/`position.coords.longitude` in the success callback argument
  - You can use the long/lat coords in something like Google's Geocoding API to get an address, etc.

### Getting the Current Location:

```javascript
locationBtn.addEventListener("click", function (event) {
  // check if geolocation is supported first
  if (!("geolocation" in navigator)) {
    return;
  }
  // UI feedback, loader here etc.

  // this will prompt the user for permission
  navigator.geolocation.getCurrentPosition(
    (position) => {
      // show loader here for ui feedback etc

      // you have access to latitude and longitude coords (use them with Google's Geocoding API etc. if you want)
      fetchedLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      locationInput.value =
        "Use Google Geocoding API here to get address etc for display to the user";

      locationInput.classList.add("is-focused");
    },
    (err) => {
      console.error(err);
      // UI Feedback and cleanup/err handling here
    },
    {
      // time to get position and after it fails in ms
      timeout: 7000,
    }
  );
});
```
