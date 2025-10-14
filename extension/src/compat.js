(function() {
  // Cross-browser Promise-based wrapper for Chrome/Firefox WebExtensions APIs
  // Exposes a minimal `ext` namespace with `storage` and `runtime` helpers

  // Firefox exposes browser API as a global, not on window/self
  const globalBrowser = (typeof browser !== 'undefined') ? browser : (typeof self !== 'undefined' && self.browser) ? self.browser : (typeof window !== 'undefined' && window.browser) ? window.browser : null;
  const globalChrome = (typeof chrome !== 'undefined') ? chrome : (typeof self !== 'undefined' && self.chrome) ? self.chrome : (typeof window !== 'undefined' && window.chrome) ? window.chrome : null;

  function storageGet(keys) {
    if (globalBrowser && globalBrowser.storage) {
      return globalBrowser.storage.local.get(keys);
    }
    if (globalChrome && globalChrome.storage) {
      return new Promise((resolve, reject) => {
        try {
          globalChrome.storage.local.get(keys, (result) => {
            const err = globalChrome.runtime && globalChrome.runtime.lastError;
            if (err) return reject(err);
            resolve(result || {});
          });
        } catch (e) {
          reject(e);
        }
      });
    }
    return Promise.resolve({});
  }

  function storageSet(items) {
    if (globalBrowser && globalBrowser.storage) {
      return globalBrowser.storage.local.set(items);
    }
    if (globalChrome && globalChrome.storage) {
      return new Promise((resolve, reject) => {
        try {
          globalChrome.storage.local.set(items, () => {
            const err = globalChrome.runtime && globalChrome.runtime.lastError;
            if (err) return reject(err);
            resolve();
          });
        } catch (e) {
          reject(e);
        }
      });
    }
    return Promise.resolve();
  }

  function storageRemove(keys) {
    if (globalBrowser && globalBrowser.storage) {
      return globalBrowser.storage.local.remove(keys);
    }
    if (globalChrome && globalChrome.storage) {
      return new Promise((resolve, reject) => {
        try {
          globalChrome.storage.local.remove(keys, () => {
            const err = globalChrome.runtime && globalChrome.runtime.lastError;
            if (err) return reject(err);
            resolve();
          });
        } catch (e) {
          reject(e);
        }
      });
    }
    return Promise.resolve();
  }

  function runtimeSendMessage(message) {
    if (globalBrowser && globalBrowser.runtime) {
      return globalBrowser.runtime.sendMessage(message);
    }
    if (globalChrome && globalChrome.runtime) {
      return new Promise((resolve, reject) => {
        try {
          globalChrome.runtime.sendMessage(message, (response) => {
            const err = globalChrome.runtime && globalChrome.runtime.lastError;
            if (err) return reject(err);
            resolve(response);
          });
        } catch (e) {
          reject(e);
        }
      });
    }
    return Promise.resolve(undefined);
  }

  const ext = {
    storage: {
      get: storageGet,
      set: storageSet,
      remove: storageRemove
    },
    runtime: {
      sendMessage: runtimeSendMessage
    }
  };

  // Export to global scope
  if (typeof self !== 'undefined') self.ext = ext;
  if (typeof window !== 'undefined') window.ext = ext;
  if (typeof global !== 'undefined') global.ext = ext;
})();


