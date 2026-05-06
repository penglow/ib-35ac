// IndexedDB storage wrapper — replaces localStorage for large game saves.
// Falls back to localStorage if IndexedDB is unavailable.
//
// The game uses this module for all persistent storage (save files, collection data)
// because IndexedDB can handle the ~50KB+ serialized game state that localStorage
// quotas may reject on some mobile browsers.

// Immediately-invoked function expression (IIFE) returns the STORE singleton,
// exposing getItem / setItem / removeItem with an identical interface to localStorage.
const STORE = (() => {
  // Database identity — change DB_NAME to wipe all IndexedDB data on next load.
  const DB_NAME = "biomon_v1";
  const DB_VERSION = 1;
  const STORE_NAME = "kv";

  // Cached IDBDatabase reference; null means "not yet opened" rather than "failed".
  let db = null;

  // Opens (or reuses) the IndexedDB connection. The onupgradeneeded handler
  // creates the object store schema if this is the first visit on this browser.
  function openDB() {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(STORE_NAME)) {
          d.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = (e) => { db = e.target.result; resolve(db); };
      req.onerror = () => reject(req.error);
    });
  }

  // Reads a value from IndexedDB by key. Falls back to localStorage on any error.
  async function getItem(key) {
    try {
      const d = await openDB();
      return new Promise((resolve) => {
        const tx = d.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result != null ? req.result : null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return localStorage_get(key);
    }
  }

  // Writes a key-value pair to IndexedDB. Always also writes to localStorage as a
  // secondary fallback in case the IDB write silently fails (e.g. quota on some browsers).
  async function setItem(key, value) {
    try {
      const d = await openDB();
      await new Promise((resolve, reject) => {
        const tx = d.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // IndexedDB failed; localStorage fallback handled below
    }
    try {
      localStorage_set(key, value);
    } catch (e) {
      // ignore localStorage quota errors
    }
  }

  // Removes a key from both IndexedDB and localStorage.
  async function removeItem(key) {
    try {
      const d = await openDB();
      await new Promise((resolve) => {
        const tx = d.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // ignore IndexedDB errors
    }
    try {
      localStorage_remove(key);
    } catch {
      // ignore localStorage errors
    }
  }

  // --- localStorage fallback helpers (synchronous, no-throw) ---
  function localStorage_get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function localStorage_set(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { console.warn("localStorage setItem failed:", key, e); }
  }
  function localStorage_remove(key) {
    try { localStorage.removeItem(key); } catch (e) { console.warn("localStorage removeItem failed:", key, e); }
  }

  return { getItem, setItem, removeItem };
})();
