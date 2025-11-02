// Page context script - runs in MAIN world to access window.cookies
// Communicates with content script via custom events

(function() {
  'use strict';

  // Listen for requests from content script
  window.addEventListener('twitch-mutual-follows:get-login', () => {
    try {
      let login = null;
      
      // Try to read from window.cookies (Twitch's global object)
      if (window.cookies && window.cookies.login) {
        login = window.cookies.login;
      }

      // Send response back to content script
      window.dispatchEvent(new CustomEvent('twitch-mutual-follows:login-response', {
        detail: { login }
      }));
    } catch (e) {
      console.warn('[Twitch Mutual Follows] Failed to read window.cookies:', e);
      window.dispatchEvent(new CustomEvent('twitch-mutual-follows:login-response', {
        detail: { login: null }
      }));
    }
  });

  // Signal that page script is ready
  window.dispatchEvent(new CustomEvent('twitch-mutual-follows:ready'));
})();

