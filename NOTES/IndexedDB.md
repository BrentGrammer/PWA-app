## Caching Dynamic Content with IndexedDB

### IndexedDB:

- A transactional key value database running in the browser

  - if one of the actions in a given transaction fails, none of the actions are applied

- Can be accessed Asynchronously

  - Can access through normal JS code or service worker code.
  - As opposed to local/session storage which is synchronous and cannot be accessed by service workers

- Typically used to store json data or data which you want to transform for later use

  - Use IndexDB to store dynamic content retrieved from requests to an api (Dynamic Data that changes frequently)
  - Store JSON or XML data. Structured data that you get from your backend
  - Don't store files/assets which define how your app works (javascript files, css files, html etc.)

- IndexedDB is for storing structured(i.e. JSON) data and is more powerful for using that than the Cache storage.

  - The Cache API stores the whole response, and then you have to parse it to get the data
  - You have more control over what you want to store (i.e. part of the response, etc.), you can transform the data and store it as well.
  - You can technically store unstructured data in IndexedDB (files/blobs), but it is really better for structured data

- Supported by many browsers
  - normal browser feature accessed directly in JavaScript
  - The vanilla api is a little clunky - **Use this package:** [idb](https://github.com/jakearchibald/idb)
    - idb wraps the api and allows you to use promises which is more idiomatic to service worker code vs. callbacks
    - can import it into your service worker code with `importScripts([path])`
    - also cache it in your static assets cached in the service worker

### Using IDB Package:

- Two modes when you open indexedDB: 'readwrite' and 'readonly'
- On every write operation you need to open and return and complete a transaction (`return tx.complete;`)

```javascript
//store var which gives you access to indexedDB in a promise like way - returns a db object you can use to write data to the db etc:
// first arg is name of db, second is version number you can bump, third is a callback that runs everytime the database is created
var dbPromise = idb.open("posts-store", 1, function (db) {
  // check if the db object store already exists first!
  if (!db.objectStoreNames.contains("posts")) {
    // create an object store which is like a table:
    // pass name of table and object where you define the primary key which you use to receive objects by that key - set it to the name of the property you want to use as the pk
    db.createObjectStore("posts", { keyPath: "id" });
  }
});
```

- Storing data in the `fetch` lifecycle event in service worker:

```javascript
event.respondWith(
  fetch(event.request).then(function (res) {
    // store this dynamic data in indexedDB.  Make a clone, Transform and store it
    var clonedRes = res.clone();
    clonedRes.json().then(function (data) {
      Object.keys(data).forEach((key) => {
        dbPromise.then(function (db) {
          // create a transaction - pass in which table/object store to target, and what type - readwrite or readonly
          var transaction = db.transaction("posts", "readwrite");
          // explicitly open the store
          var store = transaction.objectStore("posts");
          store.put(data[key]);
          // close the transaction
          return transaction.complete;
        });
      });
    });
    // return the original request
    return res;
  })
);
```

**NOTE ON PUT**: `store.put(data);`

- put overrides all values - this updates when resource on network changes
- if the value is gone from the network, then put will not remove the value from indexedDB - this can cause sync issues when offline.
- A way to mitigate this is to clear the database before writing to it either completely or individual items, so you don't have cached items that don't currently exist on the backend.

- **Reading Data**

```javascript
function readAllData(store) {
  return dbPromise.then(function (db) {
    var tx = db.transaction(store, "readonly");
    var st = tx.objectStore(store);
    return st.getAll(); // no need to close transaction - only a read so it if fails, no data is returned and database integrity is unaffected
  });
}
```

- **Deleting Data**

```javascript
// clears the database so that sync issues don't occur (a deleted item on the back end is stil in the cache)
function clearAllData(store) {
  return dbPromise.then(function (db) {
    var tx = db.transaction(store, "readwrite");
    var st = tx.objectStore(store);
    st.clear();
    return tx.complete;
  });
}

function deleteItemFromStore(st, id) {
  return dbPromise
    .then(function (db) {
      var tx = db.transaction(st, "readwrite");
      var store = tx.objectStore(st);
      store.delete(id);
      return tx.complete;
    })
    .then(function () {
      console.log("item deleted");
    });
}
```

## Further Resources

- IndexedDB Browser Support: http://caniuse.com/#feat=indexeddb
- IDB on Github: https://github.com/jakearchibald/idb
- IndexedDB explained on MDN: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- Alternative to IDB: http://dexie.org/
