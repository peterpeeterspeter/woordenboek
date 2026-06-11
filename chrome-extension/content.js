/**
 * Content script — double-click word selection popup
 * Shows a lightweight preview popup near the selected word.
 * Users click "Meer op Woordenboek.org" for the full page.
 */

const API_BASE = 'https://www.woordenboek.org/api/lookup';
let popupEl = null;
let isLoading = false;

/* ---- Create popup element ---- */
function createPopup() {
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
  if (!popupEl) createPopup();
  popupEl.style.display = 'block';

  // Position: prefer below-right, but keep in viewport
  const rect = popupEl.getBoundingClientRect();
  let left = x + 10;
  let top = y + 10;
  if (left + 320 > window.innerWidth) left = x - 330;
  if (top + 200 > window.innerHeight) top = y - 210;
  popupEl.style.left = Math.max(5, left) + 'px';
  popupEl.style.top = Math.max(5, top) + 'px';
}

function hidePopup() {
  if (popupEl) {
    popupEl.style.display = 'none';
    popupEl.querySelector('.wb-loading').style.display = 'none';
    popupEl.querySelector('.wb-body').style.display = 'block';
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
    popupEl.querySelector('.wb-link').href = data.url;
    popupEl.querySelector('.wb-synonyms').style.display = 'none';
    popupEl.querySelector('.wb-translations').style.display = 'none';
    return;
  }

  popupEl.querySelector('.wb-word').textContent = data.word;
  popupEl.querySelector('.wb-pos').textContent = data.gender ? `(${data.gender})` : '';
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

/* ---- Double-click handler ---- */
document.addEventListener('dblclick', (e) => {
  // Don't trigger in inputs/textareas or inside our own popup
  if (popupEl && popupEl.contains(e.target)) return;
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  const selection = window.getSelection();
  const text = (selection ? selection.toString().trim() : '');

  // Only accept single words (allow hyphenated)
  if (!text || text.includes(' ') || text.length > 40) return;

  // Must be mostly letters
  if (!/^[a-zA-ZäëïöüáéíóúàèìòùâêîôûñçÄËÏÖÜÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÑÇ-]+$/.test(text)) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  showPopup(rect.left + window.scrollX, rect.bottom + window.scrollY);

  // Show loading
  popupEl.querySelector('.wb-body').style.display = 'none';
  popupEl.querySelector('.wb-loading').style.display = 'block';
  popupEl.querySelector('.wb-word').textContent = text;
  popupEl.querySelector('.wb-pos').textContent = '';

  // Fetch data
  const url = `${API_BASE}?q=${encodeURIComponent(text.toLowerCase())}`;
  fetch(url)
    .then(r => r.json())
    .then(data => renderData(data))
    .catch(() => {
      popupEl.querySelector('.wb-loading').style.display = 'none';
      popupEl.querySelector('.wb-body').style.display = 'block';
      popupEl.querySelector('.wb-meaning').textContent = 'Kon geen gegevens ophalen.';
    });
});
