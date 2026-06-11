/**
 * Popup script — search interface for Woordenboek.org extension
 */

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultArea = document.getElementById('resultArea');
const errorArea = document.getElementById('errorArea');
const loadingArea = document.getElementById('loadingArea');
const recentArea = document.getElementById('recentArea');

/* ---- Helpers ---- */
function showArea(area) {
  [resultArea, errorArea, loadingArea, recentArea].forEach(a => a.style.display = 'none');
  area.style.display = area === recentArea ? 'block' : '';
}

/* ---- Search ---- */
function doSearch() {
  const word = searchInput.value.trim().toLowerCase();
  if (!word) return;

  showArea(loadingArea);

  chrome.runtime.sendMessage({ type: 'lookup', word }, (data) => {
    if (chrome.runtime.lastError) {
      showArea(errorArea);
      document.getElementById('errorMsg').textContent =
        'Kan geen verbinding maken met Woordenboek.org.';
      return;
    }

    if (data.error) {
      showArea(errorArea);
      document.getElementById('errorMsg').textContent =
        'Er is een fout opgetreden: ' + data.error;
      return;
    }

    if (!data.found) {
      showArea(resultArea);
      document.getElementById('resultWord').textContent = data.word;
      document.getElementById('resultGender').textContent = '';
      document.getElementById('resultMeaning').textContent = 'Woord niet gevonden.';
      document.getElementById('resultSynonyms').style.display = 'none';
      document.getElementById('resultTranslations').style.display = 'none';
      document.getElementById('resultLink').href = data.url;
      return;
    }

    showArea(resultArea);

    document.getElementById('resultWord').textContent = data.word;
    document.getElementById('resultGender').textContent =
      data.gender ? `(${data.gender})` : '';
    document.getElementById('resultMeaning').textContent =
      data.meaning || 'Geen betekenis beschikbaar.';
    document.getElementById('resultLink').href = data.url;

    // Synonyms
    if (data.synonyms && data.synonyms.length > 0) {
      document.getElementById('resultSynonyms').style.display = 'block';
      const synList = document.getElementById('resultSynList');
      synList.innerHTML = data.synonyms
        .map(s => `<span class="result-tag" data-word="${s}">${s}</span>`)
        .join('');
    } else {
      document.getElementById('resultSynonyms').style.display = 'none';
    }

    // Translations
    const transKeys = Object.keys(data.translations || {});
    if (transKeys.length > 0) {
      document.getElementById('resultTranslations').style.display = 'block';
      const transList = document.getElementById('resultTransList');
      transList.innerHTML = transKeys
        .map(k => {
          const t = data.translations[k];
          const val = Array.isArray(t.value) ? t.value.join(', ') : t.value;
          return `<span class="result-tag" data-word="${val.split(',')[0].trim()}">${t.lang}: ${val}</span>`;
        })
        .join('');
    } else {
      document.getElementById('resultTranslations').style.display = 'none';
    }
  });
}

/* ---- Recent searches ---- */
function loadRecent() {
  chrome.runtime.sendMessage({ type: 'getRecent' }, (data) => {
    if (chrome.runtime.lastError || !data || !data.recent || data.recent.length === 0) {
      recentArea.style.display = 'none';
      return;
    }

    showArea(recentArea);
    const list = document.getElementById('recentList');
    list.innerHTML = data.recent
      .slice(0, 10)
      .map(w => `<span class="recent-item" data-word="${w}">${w}</span>`)
      .join('');
  });
}

/* ---- Event listeners ---- */
searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doSearch();
});

// Click on synonym/translation tag → search that word
document.addEventListener('click', (e) => {
  const tag = e.target.closest('[data-word]');
  if (tag) {
    searchInput.value = tag.dataset.word;
    doSearch();
  }
});

// Click on recent item → search
document.addEventListener('click', (e) => {
  const item = e.target.closest('.recent-item');
  if (item) {
    searchInput.value = item.dataset.word;
    doSearch();
  }
});

// Load recent on open
loadRecent();
