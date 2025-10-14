// Content Script for Twitch Mutual Follows Extension
// Detects user cards, extracts logins, and injects UI

console.log('[Twitch Mutual Follows] Content script loaded');

// Track processed cards to avoid duplicates
const processedCards = new WeakSet();
let currentWidget = null;
let currentModal = null;

// Card type preference
let cardTypePreference = 'native'; // 'native' or '7tv'

// Load card type preference
async function loadCardTypePreference() {
  try {
    const result = await ext.storage.get('twitch:cardType');
    cardTypePreference = result['twitch:cardType'] || 'native';
  } catch (e) {
    console.warn('[Content] Failed to load card type preference:', e);
  }
}

// ============================================================================
// Auto-detect current user's login
// ============================================================================

async function detectMyLogin() {
  // Try to get from storage first
  try {
    const response = await ext.runtime.sendMessage({ type: 'getMyLogin' });
    if (response && response.success && response.login) {
      return response.login;
    }
  } catch (e) {
    console.warn('[Content] getMyLogin message failed:', e);
  }

  // Try to detect from DOM
  const detectedLogin = extractMyLoginFromDOM();
  if (detectedLogin) {
    // Save to storage
    await ext.runtime.sendMessage({
      type: 'setMyLogin',
      login: detectedLogin
    });
    return detectedLogin;
  }

  console.warn('[Content] Could not detect my login');
  return null;
}

function extractMyLoginFromDOM() {
  // Try to find user display name from dropdown menu
  const displayNameElement = document.querySelector('[data-a-target="user-display-name"]');
  if (displayNameElement) {
    const displayName = displayNameElement.textContent.trim();
    if (displayName) {
      return displayName.toLowerCase();
    }
  }

  return null;
}

// ============================================================================
// Card Detection & Login Extraction
// ============================================================================

function isUserCard(element) {
  // Check for native Twitch viewer card
  if (cardTypePreference === 'native') {
    const isViewerCard = element.getAttribute('data-a-target') === 'viewer-card';
    
    if (!isViewerCard) {
      return false;
    }

    // Additional check: ensure it has profile links
    const hasProfileLink = element.querySelector('a[href^="/"]');
    
    return !!hasProfileLink;
  }
  
  // Check for 7TV user card
  if (cardTypePreference === '7tv') {
    const is7TVCard = element.classList.contains('seventv-user-card-header');
    
    if (!is7TVCard) {
      return false;
    }

    // Additional check: ensure it has username link
    const hasUserLink = element.querySelector('a[href*="twitch.tv/"]');
    
    return !!hasUserLink;
  }
  
  return false;
}

function extractTargetLogin(cardElement) {
  // For 7TV cards
  if (cardTypePreference === '7tv') {
    // Extract from link href: https://twitch.tv/username
    const userLink = cardElement.querySelector('a[href*="twitch.tv/"]');
    if (userLink) {
      const href = userLink.getAttribute('href');
      const match = href.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
      if (match) {
        return match[1].toLowerCase();
      }
    }
    
    // Fallback: extract from username span
    const usernameSpan = cardElement.querySelector('.seventv-chat-user-username span span');
    if (usernameSpan) {
      const username = usernameSpan.textContent.trim();
      if (username) {
        return username.toLowerCase();
      }
    }
    
    return null;
  }

  // For native Twitch cards
  // Method 1: Find profile link
  const profileLinks = cardElement.querySelectorAll('a[href^="/"]');
  for (const link of profileLinks) {
    const href = link.getAttribute('href');
    if (href && href.match(/^\/[a-zA-Z0-9_]+$/)) {
      const login = href.substring(1);
      // Exclude system pages
      if (!['directory', 'settings', 'subscriptions', 'videos', 'clips'].includes(login)) {
        return login.toLowerCase();
      }
    }
  }

  // Method 2: Look for @username text
  const textContent = cardElement.textContent || '';
  const atMatch = textContent.match(/@([a-zA-Z0-9_]+)/);
  if (atMatch) {
    return atMatch[1].toLowerCase();
  }

  // Method 3: Look for data attributes
  const userTarget = cardElement.querySelector('[data-a-user]');
  if (userTarget) {
    const login = userTarget.getAttribute('data-a-user');
    if (login) return login.toLowerCase();
  }

  return null;
}

// ============================================================================
// Widget Injection & Management
// ============================================================================

function findInsertionPoint(cardElement) {
  // For 7TV cards
  if (cardTypePreference === '7tv') {
    // cardElement is seventv-user-card-header, we need to find the parent card and insert after interactive section
    // Navigate up to find the parent seventv-user-card
    let parentCard = cardElement.parentElement;
    if (parentCard && parentCard.classList.contains('seventv-user-card')) {
      // Find the interactive section within parent card
      const interactiveSection = parentCard.querySelector('.seventv-user-card-interactive');
      if (interactiveSection) {
        return interactiveSection;
      }
    }
    
    // Fallback: return parent card or the element itself
    return parentCard || cardElement;
  }

  // For native Twitch cards
  // Find a good place to insert the widget
  // Try to insert at the bottom of the card, after the buttons section

  // Look for the buttons container (contains Follow, Message, Gift buttons)
  const buttonsContainer = cardElement.querySelector('[class*="jHLEAt"]') || // Current structure
                          cardElement.querySelector('[data-a-target*="follow-button"]')?.closest('[class^="Layout"]')?.parentElement;

  if (buttonsContainer) {
    return buttonsContainer.parentElement; // Insert after buttons section
  }

  // Fallback: look for viewer-card container
  const viewerCard = cardElement.querySelector('[data-a-target="viewer-card"]') ||
                     cardElement.querySelector('.viewer-card');

  if (viewerCard) {
    return viewerCard;
  }

  // Last resort: return the card element itself
  return cardElement;
}

async function injectWidget(cardElement, targetLogin, forceRefresh = false) {
  // Clean up existing widget if any
  if (currentWidget) {
    currentWidget.destroy();
    currentWidget = null;
  }

  // Create widget
  const widget = new window.MutualFollowsWidget();
  const widgetElement = widget.create(targetLogin);

  // Find insertion point and insert
  const insertionPoint = findInsertionPoint(cardElement);
  if (insertionPoint) {
    insertionPoint.appendChild(widgetElement);
  } else {
    cardElement.appendChild(widgetElement);
  }

  currentWidget = widget;

  // Set up click handlers
  widget.onClick((action, data) => {
    if (action === 'show-modal') {
      showModal(data, targetLogin);
    } else if (action === 'retry') {
      loadAndDisplayIntersection(targetLogin, widget, true);
    }
  });

  // Load data
  await loadAndDisplayIntersection(targetLogin, widget, forceRefresh);
}

async function loadAndDisplayIntersection(targetLogin, widget, forceRefresh = false) {
  widget.setLoading();

  try {
    // Ensure we have myLogin
    const myLogin = await detectMyLogin();
    if (!myLogin) {
      widget.setError('Не найден ваш логин. Откройте настройки расширения.');
      return;
    }

    // Request intersection from background
    const response = await ext.runtime.sendMessage({
      type: 'getIntersection',
      targetLogin,
      forceRefresh
    });

    if (!response) {
      console.warn('[Content] Empty response for getIntersection');
      widget.setError('Ошибка загрузки');
      return;
    }

    if (response.success) {
      const { top4, total, allItems, isPartial } = response;

      if (total === 0) {
        widget.setEmpty();
      } else {
        widget.setSuccess({ top4, total, allItems, isPartial });
      }
    } else {
      widget.setError(response.message || 'Ошибка загрузки');
    }

  } catch (error) {
    console.error('[Content] Error loading intersection:', error);
    widget.setError('Ошибка загрузки данных');
  }
}

async function showModal(data, targetLogin) {
  // Close existing modal if any
  if (currentModal) {
    currentModal.close();
  }

  const modal = new window.MutualFollowsModal();
  // If we only have preview data, request full list before showing
  let fullData = data;
  if (!data || !Array.isArray(data.allItems)) {
    try {
      const response = await ext.runtime.sendMessage({
        type: 'getIntersectionFull',
        targetLogin,
        forceRefresh: false
      });
      if (response && response.success) {
        fullData = response;
      }
    } catch (e) {
      // ignore, modal will show with whatever we have
    }
  }

  modal.show(fullData || data, targetLogin);

  modal.onRefresh((login) => {
    // Refresh the widget
    if (currentWidget) {
      loadAndDisplayIntersection(login, currentWidget, true);
    }
  });

  modal.onClose(() => {
    currentModal = null;
  });

  currentModal = modal;
}

// ============================================================================
// Mutation Observer
// ============================================================================

function observeCards() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        // Check if the node itself is a card
        if (isUserCard(node)) {
          handleCardAppearance(node);
        }

        // Check children for cards based on preference
        let cards = [];
        if (node.querySelectorAll) {
          if (cardTypePreference === 'native') {
            cards = node.querySelectorAll('[data-a-target="viewer-card"]');
          } else if (cardTypePreference === '7tv') {
            cards = node.querySelectorAll('.seventv-user-card-header');
          }
        }
        
        for (const card of cards) {
          if (isUserCard(card)) {
            handleCardAppearance(card);
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function handleCardAppearance(cardElement) {
  // Avoid processing the same card twice
  if (processedCards.has(cardElement)) {
    return;
  }
  processedCards.add(cardElement);

  // Small delay to ensure card is fully rendered
  setTimeout(() => {
    const targetLogin = extractTargetLogin(cardElement);

    if (targetLogin) {
      console.log('[Content] Detected user card for:', targetLogin);
      injectWidget(cardElement, targetLogin);
    } else {
      console.warn('[Content] Could not extract login from card');
    }
  }, 100);
}

// ============================================================================
// Initialization
// ============================================================================

async function init() {
  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
    return;
  }

  // Load card type preference first
  await loadCardTypePreference();

  // Detect my login on page load
  detectMyLogin().then(login => {
    if (!login) {
      console.warn('[Content] Could not auto-detect login. User needs to set it manually in options.');
    }
  });

  // Start observing for user cards
  observeCards();

  // Also check for existing cards on page (in case script loads late)
  let existingCards = [];
  if (cardTypePreference === 'native') {
    existingCards = document.querySelectorAll('[data-a-target="viewer-card"]');
  } else if (cardTypePreference === '7tv') {
    existingCards = document.querySelectorAll('.seventv-user-card-header');
  }
  
  for (const card of existingCards) {
    if (isUserCard(card) && !processedCards.has(card)) {
      handleCardAppearance(card);
    }
  }
}

// Start
init();

