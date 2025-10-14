// Background Service Worker для Twitch Mutual Follows Extension

const GQL_URL = 'https://gql.twitch.tv/gql';
const CLIENT_ID = 'kd1unb4b3q4t58fwlpcbzcbnm76a8fp';
const CACHE_TTL = 1000 * 60 * 60 * 12; // 12 часов
const PAGE_LIMIT = 20;
const PREVIEW_PAGE_LIMIT = 3;

const FOLLOWING_QUERY = `
query fetchUser($login: String, $first: Int = 100, $after: Cursor) {
  user(login: $login, lookupType: ALL) {
    follows(first: $first, after: $after) {
      totalCount
      pageInfo { hasNextPage }
      edges {
        cursor
        followedAt
        node {
          login
          displayName
          profileImageURL(width: 50)
        }
      }
    }
  }
}
`;

// ============================================================================
// Cache Management
// ============================================================================

async function getFromCache(login) {
  const key = `twitch:follows:${login.toLowerCase()}`;
  const result = await ext.storage.get(key);
  const cached = result[key];
  
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.ts > CACHE_TTL) {
    // Expired
    await ext.storage.remove(key);
    return null;
  }
  
  return cached;
}

async function setCache(login, data) {
  const key = `twitch:follows:${login.toLowerCase()}`;
  await ext.storage.set({
    [key]: {
      ...data,
      ts: Date.now()
    }
  });
}

async function clearAllCache() {
  const all = await ext.storage.get(null);
  const keysToRemove = Object.keys(all).filter(k => k.startsWith('twitch:follows:'));
  if (keysToRemove.length > 0) {
    await ext.storage.remove(keysToRemove);
  }
  return keysToRemove.length;
}

async function clearCacheForUser(login) {
  const key = `twitch:follows:${login.toLowerCase()}`;
  await ext.storage.remove(key);
}

// ============================================================================
// GQL API
// ============================================================================

async function fetchFollows(login, pageLimit = PAGE_LIMIT, forceRefresh = false) {
  // Check cache first
  if (!forceRefresh) {
    const cached = await getFromCache(login);
    if (cached) {
      return cached;
    }
  }
  
  let cursor = null;
  let items = [];
  let totalCount = 0;
  let isPartial = false;

  try {
    for (let page = 1; page <= pageLimit; page++) {
      const res = await fetch(GQL_URL, {
        method: 'POST',
        headers: {
          'Client-ID': CLIENT_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: FOLLOWING_QUERY,
          variables: { login, after: cursor, first: 100 }
        })
      });

      if (!res.ok) {
        throw new Error(`gql_http_${res.status}`);
      }

      const data = await res.json();
      const user = data?.data?.user;
      
      if (!user) {
        throw new Error('user_not_found');
      }

      const follows = user.follows;
      totalCount = follows?.totalCount ?? totalCount;

      const edges = follows?.edges ?? [];
      for (const e of edges) {
        cursor = e.cursor;
        if (e?.node?.login) {
          items.push({
            login: e.node.login,
            displayName: e.node.displayName || e.node.login,
            profileImageURL: e.node.profileImageURL || '',
            followedAt: e.followedAt || null
          });
        }
      }

      if (!follows?.pageInfo?.hasNextPage) {
        break;
      }
      
      // Reached page limit but more pages available
      if (page === pageLimit && follows?.pageInfo?.hasNextPage) {
        isPartial = true;
      }
    }

    const result = {
      login: login.toLowerCase(),
      totalCount,
      items,
      isPartial
    };

    await setCache(login, result);
    return result;

  } catch (error) {
    console.error(`[Background] Error fetching follows for ${login}:`, error);
    throw error;
  }
}

// ============================================================================
// Intersection Logic
// ============================================================================

function findIntersection(follows1, follows2) {
  const set1 = new Set(follows1.items.map(x => x.login.toLowerCase()));
  const intersection = [];
  
  for (const item of follows2.items) {
    if (set1.has(item.login.toLowerCase())) {
      intersection.push(item);
    }
  }
  
  return intersection;
}

// ============================================================================
// Message Handlers
// ============================================================================

// Use browser.runtime if available (Firefox), otherwise chrome.runtime
const runtimeAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser.runtime : chrome.runtime;

runtimeAPI.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === 'getIntersection') {
    handleGetIntersection(message, sendResponse);
    return true; // Will respond asynchronously
  }

  if (message.type === 'getIntersectionFull') {
    handleGetIntersectionFull(message, sendResponse);
    return true; // Will respond asynchronously
  }

  if (message.type === 'clearCache') {
    handleClearCache(message, sendResponse);
    return true;
  }

  if (message.type === 'clearCacheForUser') {
    handleClearCacheForUser(message, sendResponse);
    return true;
  }

  if (message.type === 'getMyLogin') {
    handleGetMyLogin(sendResponse);
    return true;
  }

  if (message.type === 'setMyLogin') {
    handleSetMyLogin(message, sendResponse);
    return true;
  }
});

async function handleGetIntersection(message, sendResponse) {
  const { targetLogin, forceRefresh } = message;

  try {
    // Get my login
    const result = await ext.storage.get('twitch:myLogin');
    const myLogin = result['twitch:myLogin'];

    if (!myLogin) {
      sendResponse({
        success: false,
        error: 'no_login',
        message: 'Не найден ваш логин. Установите его в настройках расширения.'
      });
      return;
    }

    // Fetch follows for both users (with retry logic)
    let myFollows, targetFollows;
    let retryCount = 0;
    const maxRetries = 1;

    while (retryCount <= maxRetries) {
      try {
        [myFollows, targetFollows] = await Promise.all([
          fetchFollows(myLogin, PREVIEW_PAGE_LIMIT, forceRefresh),
          fetchFollows(targetLogin, PREVIEW_PAGE_LIMIT, forceRefresh)
        ]);
        break;
      } catch (error) {
        if (retryCount < maxRetries && !error.message.includes('user_not_found')) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          throw error;
        }
      }
    }

    // Compute intersection
    const intersection = findIntersection(myFollows, targetFollows);
    const isPartial = true; // preview intentionally partial

    // Prepare response
    const top4 = intersection.slice(0, 6);
    const total = intersection.length;

    sendResponse({
      success: true,
      top4,
      total,
      isPartial,
      targetLogin
    });

  } catch (error) {
    console.error('[Background] Error in getIntersection:', error);
    
    let errorMessage = 'Ошибка загрузки';
    let errorCode = 'source_error';

    if (error.message === 'user_not_found') {
      errorMessage = 'Пользователь не найден';
      errorCode = 'user_not_found';
    } else if (error.message.includes('gql_http_429')) {
      errorMessage = 'Слишком много запросов, попробуйте позже';
      errorCode = 'rate_limit';
    }

    sendResponse({
      success: false,
      error: errorCode,
      message: errorMessage
    });
  }
}

async function handleGetIntersectionFull(message, sendResponse) {
  const { targetLogin, forceRefresh } = message;

  try {
    // Get my login
    const result = await ext.storage.get('twitch:myLogin');
    const myLogin = result['twitch:myLogin'];

    if (!myLogin) {
      sendResponse({ success: false, error: 'no_login', message: 'Не найден ваш логин. Установите его в настройках расширения.' });
      return;
    }

    const [myFollows, targetFollows] = await Promise.all([
      fetchFollows(myLogin, PAGE_LIMIT, forceRefresh),
      fetchFollows(targetLogin, PAGE_LIMIT, forceRefresh)
    ]);

    const intersection = findIntersection(myFollows, targetFollows);
    const isPartial = myFollows.isPartial || targetFollows.isPartial;

    const top4 = intersection.slice(0, 6);
    const total = intersection.length;

    sendResponse({ success: true, top4, total, allItems: intersection, isPartial, targetLogin });

  } catch (error) {
    console.error('[Background] Error in getIntersectionFull:', error);
    let errorMessage = 'Ошибка загрузки';
    let errorCode = 'source_error';
    if (error.message === 'user_not_found') {
      errorMessage = 'Пользователь не найден';
      errorCode = 'user_not_found';
    } else if (error.message.includes('gql_http_429')) {
      errorMessage = 'Слишком много запросов, попробуйте позже';
      errorCode = 'rate_limit';
    }
    sendResponse({ success: false, error: errorCode, message: errorMessage });
  }
}

async function handleClearCache(message, sendResponse) {
  try {
    const count = await clearAllCache();
    sendResponse({ success: true, count });
  } catch (error) {
    console.error('[Background] Error clearing cache:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

async function handleClearCacheForUser(message, sendResponse) {
  try {
    await clearCacheForUser(message.login);
    sendResponse({ success: true });
  } catch (error) {
    console.error('[Background] Error clearing cache for user:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

async function handleGetMyLogin(sendResponse) {
  try {
    const result = await ext.storage.get('twitch:myLogin');
    const response = { success: true, login: result['twitch:myLogin'] || null };
    sendResponse(response);
  } catch (error) {
    console.error('[Background] Error in handleGetMyLogin:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

async function handleSetMyLogin(message, sendResponse) {
  try {
    await ext.storage.set({ 'twitch:myLogin': message.login.toLowerCase() });
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: String(error) });
  }
}

console.log('[Background] Service worker initialized');

