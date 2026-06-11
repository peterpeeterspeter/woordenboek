/**
 * Content script — injected by background.js via chrome.scripting
 * Shows popup near selected word with meaning, synonyms, translations.
 */

const API_BASE = 'https://www.woordenboek.org/api/lookup';
let popupEl = null;

/* ---- Create popup element ---- */
function createPopup() {
  if (popupEl) return popupEl;
  const popup = document.createElement('div');
  popup.id = 'wb-popup';
  popup.innerHTML = `
    <div class="wb-header">
      <span class="wb-word"></span>
      <span class="wb-pos"></span>
      <button class="wb-close" title="Sluiten">&times;</button>
    </div>
    <div class="wb-body">
      <div class="wb-meaning"></div>
      <div class="wb-section wb-synonyms" style="display:none">
        <span class="wb-label">Synoniemen:</span>
        <span class="wb-values"></span>
      </div>
      <div class="wb-section wb-translations" style="display:none">
        <span class="wb-label">Vertaling:</span>
        <span class="wb-values"></span>
      </div>
    </div>
    <div class="wb-footer">
      <a class="wb-link" href="#" target="_blank" rel="noopener">Meer op Woordenboek.org →</a>
    </div>
    <div class="wb-loading" style="display:none">Zoeken...</div>
  `;
  document.body.appendChild(popup);
  popupEl = popup;

  popup.querySelector('.wb-close').addEventListener('click', () => hidePopup());
  document.addEventListener('mousedown', (e) => {
    if (!popup.contains(e.target)) hidePopup();
  });
  return popup;
}

/* ---- Show / hide ---- */
function showPopup(x, y) {
  const popup = createPopup();
  popup.style.display = 'block';
  // Position: prefer below-right, keep in viewport
  let left = x + 10;
  let top = y + 10;
  if (left + 320 > window.innerWidth) left = x - 330;
  if (top + 200 > window.innerHeight) top = y - 210;
  popup.style.left = Math.max(5, left) + 'px';
  popup.style.top = Math.max(5, top) + window.scrollY + 'px';
}

function hidePopup() {
  if (popupEl) {
    popupEl.style.display = 'none';
  }
}

/* ---- Populate data ---- */
function renderData(data) {
  if (!popupEl) return;
  popupEl.querySelector('.wb-loading').style.display = 'none';
  popupEl.querySelector('.wb-body').style.display = 'block';

  if (!data.found) {
    popupEl.querySelector('.wb-word').textContent = data.word;
    popupEl.querySelector('.wb-meaning').textContent = 'Woord niet gevonden.';
    popupEl.querySelector('.wb-link').href = data.url || '#';
    popupEl.querySelector('.wb-synonyms').style.display = 'none';
    popupEl.querySelector('.wb-translations').style.display = 'none';
    return;
  }

  popupEl.querySelector('.wb-word').textContent = data.word;
  popupEl.querySelector('.wb-pos').textContent = data.partOfSpeech || (data.gender ? `(${data.gender})` : '');
  popupEl.querySelector('.wb-meaning').textContent = data.meaning || 'Geen betekenis beschikbaar.';
  popupEl.querySelector('.wb-link').href = data.url;

  // Synonyms
  if (data.synonyms && data.synonyms.length > 0) {
    popupEl.querySelector('.wb-synonyms').style.display = 'flex';
    popupEl.querySelector('.wb-synonyms .wb-values').textContent = data.synonyms.join(', ');
  } else {
    popupEl.querySelector('.wb-synonyms').style.display = 'none';
  }

  // Translations
  const transKeys = Object.keys(data.translations || {});
  if (transKeys.length > 0) {
    popupEl.querySelector('.wb-translations').style.display = 'flex';
    const parts = transKeys.map(k => {
      const t = data.translations[k];
      const val = Array.isArray(t.value) ? t.value.join(', ') : t.value;
      return `${t.lang}: ${val}`;
    });
    popupEl.querySelector('.wb-translations .wb-values').textContent = parts.join(' | ');
  } else {
    popupEl.querySelector('.wb-translations').style.display = 'none';
  }
}

/* ---- Fetch and show ---- */
function lookupAndShow(word, x, y) {
  showPopup(x, y);
  popupEl.querySelector('.wb-body').style.display = 'none';
  popupEl.querySelector('.wb-loading').style.display = 'block';
  popupEl.querySelector('.wb-word').textContent = word;
  popupEl.querySelector('.wb-pos').textContent = '';

  fetch(`${API_BASE}?q=${encodeURIComponent(word)}`)
    .then(r => r.json())
    .then(data => renderData(data))
    .catch(() => {
      popupEl.querySelector('.wb-loading').style.display = 'none';
      popupEl.querySelector('.wb-body').style.display = 'block';
      popupEl.querySelector('.wb-meaning').textContent = 'Kon geen gegevens ophalen.';
    });
}

/* ---- Listen for messages from background (context menu trigger) ---- */
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'showPopup' && msg.word) {
    // Show near cursor/selection
    const sel = window.getSelection();
    let x = 200, y = 200;
    if (sel && sel.rangeCount > 0) {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      x = rect.left;
      y = rect.bottom;
    }
    lookupAndShow(msg.word, x, y);
  }
});
