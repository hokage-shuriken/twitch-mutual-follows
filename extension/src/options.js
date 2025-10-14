// Options page script

const $ = (id) => document.getElementById(id);

// ============================================================================
// Load Settings
// ============================================================================

async function loadSettings() {
  try {
    const result = await ext.storage.get('twitch:myLogin');
    const myLogin = result['twitch:myLogin'];
    
    if (myLogin) {
      $('myLogin').value = myLogin;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// ============================================================================
// Save Login
// ============================================================================

async function saveLogin() {
  const loginInput = $('myLogin');
  const login = loginInput.value.trim().toLowerCase();

  if (!login) {
    showStatus('saveStatus', 'error', 'Пожалуйста, введите ваш логин');
    return;
  }

  // Validate login format (alphanumeric + underscore)
  if (!/^[a-z0-9_]+$/.test(login)) {
    showStatus('saveStatus', 'error', 'Логин может содержать только буквы, цифры и подчёркивание');
    return;
  }

  try {
    const response = await ext.runtime.sendMessage({
      type: 'setMyLogin',
      login
    });

    if (response.success) {
      showStatus('saveStatus', 'success', 'Логин сохранён успешно!');
      loginInput.value = login; // Update with normalized value
    } else {
      showStatus('saveStatus', 'error', 'Ошибка сохранения: ' + response.error);
    }
  } catch (error) {
    console.error('Error saving login:', error);
    showStatus('saveStatus', 'error', 'Ошибка сохранения логина');
  }
}

// ============================================================================
// Clear Cache
// ============================================================================

async function clearCache() {
  const button = $('clearCache');
  button.disabled = true;
  button.textContent = 'Очистка...';

  try {
    const response = await ext.runtime.sendMessage({
      type: 'clearCache'
    });

    if (response.success) {
      const count = response.count || 0;
      showStatus('cacheStatus', 'success', `Кеш очищен! Удалено записей: ${count}`);
    } else {
      showStatus('cacheStatus', 'error', 'Ошибка очистки кеша');
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    showStatus('cacheStatus', 'error', 'Ошибка очистки кеша');
  } finally {
    button.disabled = false;
    button.textContent = 'Очистить весь кеш';
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
// Event Listeners
// ============================================================================

$('saveLogin').addEventListener('click', saveLogin);
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

loadSettings();

