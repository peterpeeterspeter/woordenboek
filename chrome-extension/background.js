/**
 * Background service worker — context menu + badge counter
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

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'woordenboek-lookup' && info.selectionText) {
    const word = info.selectionText.trim();
    if (word) {
      // Open the full page in a new tab
      const url = `https://www.woordenboek.org/betekenis/${encodeURIComponent(word.toLowerCase())}`;
      chrome.tabs.create({ url });
    }
  }
});

/* ---- Message handler for lookup requests from popup/content ---- */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'lookup' && msg.word) {
    const url = `${API_BASE}?q=${encodeURIComponent(msg.word.trim().toLowerCase())}`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        // Save to recent searches
        chrome.storage.local.get({ recent: [] }, (result) => {
          const recent = result.recent.filter(w => w !== msg.word.trim().toLowerCase());
          recent.unshift(msg.word.trim().toLowerCase());
          if (recent.length > 20) recent.length = 20;
          chrome.storage.local.set({ recent });
        });
        sendResponse(data);
      })
      .catch(err => sendResponse({ error: err.message }));
    return true; // async response
  }

  if (msg.type === 'getRecent') {
    chrome.storage.local.get({ recent: [] }, (result) => {
      sendResponse({ recent: result.recent });
    });
    return true;
  }
});
