//store var which gives you access to indexedDB in a promise like way - returns a db object you can use to write data to the db etc:
// first arg is name of db, second is version number you can bump, third is a callback that runs everytime the database is created
var dbPromise = idb.open("posts-store", 1, function (db) {
  // check if the db object store already exists first!
  if (!db.objectStoreNames.contains("posts")) {
    // create an object store which is like a table:
    // pass name of table and object where you define the primary key which you use to receive objects by that key - set it to the name of the property you want to use as the pk
    // (the data returned from firebase has an id property)
    db.createObjectStore("posts", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("sync-posts")) {
    // store for keeping data to send in background sync tasks
    db.createObjectStore("sync-posts", { keyPath: "id" });
  }
});

function writeData(store, data) {
  return dbPromise.then(function (db) {
    // create a transaction - pass in which table/object store to target, and what type - readwrite or readonly
    var transaction = db.transaction(store, "readwrite");
    // explicitly open the store
    var st = transaction.objectStore(store);
    st.put(data); // put overrides all values - this updates when resource on network changes
    // NOTE: if the value is gone from the network, then put will not remove the value from indexedDB - this can cause sync issues when offline.
    // close the transaction
    return transaction.complete;
  });
}

// returns a promise with data after resolving
// note: technically you don't need to return the promise, but it gives you the option of chaining on to it if you want.
function readAllData(store) {
  return dbPromise.then(function (db) {
    var tx = db.transaction(store, "readonly");
    var st = tx.objectStore(store);
    return st.getAll(); // no need to close transaction - only a read so it if fails, no data is returned and database integrity is unaffected
  });
}

// clears the database so that sync issues don't occur (a deleted item on the back end is stil in the cache)
function clearAllData(store) {
  return dbPromise.then(function (db) {
    var tx = db.transaction(store, "readwrite");
    var st = tx.objectStore(store);
    st.clear();
    return tx.complete;
  });
}

function deleteItemFromData(st, id) {
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
