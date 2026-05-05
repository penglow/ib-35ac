// IndexedDB storage wrapper — replaces localStorage for large game saves.
// Falls back to localStorage if IndexedDB is unavailable.

const STORE = (() => {
  const DB_NAME = "biomon_v1";
  const DB_VERSION = 1;
  const STORE_NAME = "kv";

  let db = null;

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
