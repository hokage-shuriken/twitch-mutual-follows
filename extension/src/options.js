// Options page script

const $ = (id) => document.getElementById(id);

// ============================================================================
// Localization
// ============================================================================

function localizeHtml() {
  // Localize text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = ext.i18n.getMessage(key);
  });

  // Localize HTML content
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    el.innerHTML = ext.i18n.getMessage(key);
  });

  // Localize placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = ext.i18n.getMessage(key);
  });

  // Localize title
  document.title = ext.i18n.getMessage('extensionName');
}

// ============================================================================
// Load Settings
// ============================================================================

async function loadSettings() {
  try {
    const result = await ext.storage.get(['twitch:myLogin', 'twitch:cardType']);
    const myLogin = result['twitch:myLogin'];
    const cardType = result['twitch:cardType'] || 'native';
    
    if (myLogin) {
      $('myLogin').value = myLogin;
    }
    
    $('cardType').value = cardType;
  } catch (error) {
    console.error('[Options] Error loading settings:', error);
  }
}

// ============================================================================
// Save Login
// ============================================================================

async function saveLogin() {
  const loginInput = $('myLogin');
  const login = loginInput.value.trim().toLowerCase();

  if (!login) {
    showStatus('saveStatus', 'error', ext.i18n.getMessage('errorLoginRequired'));
    return;
  }

  // Validate login format (alphanumeric + underscore)
  if (!/^[a-z0-9_]+$/.test(login)) {
    showStatus('saveStatus', 'error', ext.i18n.getMessage('errorLoginFormat'));
    return;
  }

  try {
    const response = await ext.runtime.sendMessage({
      type: 'setMyLogin',
      login
    });

    if (response.success) {
      showStatus('saveStatus', 'success', ext.i18n.getMessage('successLoginSaved'));
      loginInput.value = login; // Update with normalized value
    } else {
      showStatus('saveStatus', 'error', ext.i18n.getMessage('errorSaving', [response.error]));
    }
  } catch (error) {
    console.error('[Options] Error saving login:', error);
    showStatus('saveStatus', 'error', ext.i18n.getMessage('errorSavingLogin'));
  }
}

// ============================================================================
// Clear Cache
// ============================================================================

async function clearCache() {
  const button = $('clearCache');
  button.disabled = true;
  button.textContent = ext.i18n.getMessage('clearing');

  try {
    const response = await ext.runtime.sendMessage({
      type: 'clearCache'
    });

    if (response.success) {
      const count = response.count || 0;
      showStatus('cacheStatus', 'success', ext.i18n.getMessage('successCacheCleared', [count]));
    } else {
      showStatus('cacheStatus', 'error', ext.i18n.getMessage('errorClearingCache'));
    }
  } catch (error) {
    console.error('[Options] Error clearing cache:', error);
    showStatus('cacheStatus', 'error', ext.i18n.getMessage('errorClearingCache'));
  } finally {
    button.disabled = false;
    button.textContent = ext.i18n.getMessage('clearAllCache');
  }
}

// ============================================================================
// UI Helpers
// ============================================================================

function showStatus(elementId, type, message) {
  const statusEl = $(elementId);
  statusEl.innerHTML = `<div class="status-message status-${type}">${message}</div>`;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (statusEl.innerHTML.includes(message)) {
      statusEl.innerHTML = '';
    }
  }, 5000);
}

// ============================================================================
// Save Card Type
// ============================================================================

async function saveCardType() {
  const cardType = $('cardType').value;

  try {
    await ext.storage.set({ 'twitch:cardType': cardType });
    showStatus('cardTypeStatus', 'success', ext.i18n.getMessage('successCardTypeSaved'));
  } catch (error) {
    console.error('[Options] Error saving card type:', error);
    showStatus('cardTypeStatus', 'error', ext.i18n.getMessage('errorSavingCardType'));
  }
}

// ============================================================================
// Event Listeners
// ============================================================================

$('saveLogin').addEventListener('click', saveLogin);
$('saveCardType').addEventListener('click', saveCardType);
$('clearCache').addEventListener('click', clearCache);

// Allow Enter key in login input
$('myLogin').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveLogin();
  }
});

// ============================================================================
// Initialize
// ============================================================================

localizeHtml();
loadSettings();

