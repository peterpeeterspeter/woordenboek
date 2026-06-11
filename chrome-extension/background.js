/**
 * Background service worker — context menu + programmatic content script injection
 * Uses activeTab instead of broad host_permissions for faster Chrome Web Store review.
 */

const API_BASE = 'https://www.woordenboek.org/api/lookup';

/* ---- Context menu ---- */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'woordenboek-lookup',
    title: 'Zoek betekenis op Woordenboek.org',
    contexts: ['selection'],
  });
});

/* ---- Context menu click → inject content script, then show popup ---- */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const word = (info.selectionText || '').trim().toLowerCase();
  if (!word || word.includes(' ') || word.length > 40) return;

  // Inject content script + CSS into active tab (activeTab grants access)
  chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['content.css'] });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  }, () => {
    // After injection, send lookup message to the content script
    chrome.tabs.sendMessage(tab.id, { type: 'showPopup', word });
  });
});

/* ---- Popup search handler ---- */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'lookup') {
    lookupWord(msg.word).then(sendResponse);
    return true; // async
  }

  if (msg.type === 'getRecent') {
    chrome.storage.local.get(['recent'], (r) => {
      sendResponse({ recent: r.recent || [] });
    });
    return true;
  }
});

/* ---- API call ---- */
async function lookupWord(word) {
  try {
    const res = await fetch(`${API_BASE}?q=${encodeURIComponent(word)}`);
    if (!res.ok) return { word, found: false, error: `HTTP ${res.status}` };
    const data = await res.json();

    // Save to recent
    chrome.storage.local.get(['recent'], (r) => {
      const recent = (r.recent || []).filter(w => w !== word);
      recent.unshift(word);
      chrome.storage.local.set({ recent: recent.slice(0, 50) });
    });

    return data;
  } catch (err) {
    return { word, found: false, error: err.message };
  }
}
