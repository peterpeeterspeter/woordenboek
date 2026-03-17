/* =====================================================
   WOORDENBOEK.ORG — App Logic
   Hash-based router, lazy-loaded word data, search
   ===================================================== */

(function() {
  'use strict';

  // --- State ---
  const state = {
    wordCache: {},     // letter -> word array
    loadingLetters: {}, // letter -> Promise
    currentPage: 1,
    wordsPerPage: 500,
    totalWords: 408825,
    letterCounts: {}
  };

  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const app = document.getElementById('app');

  // --- Theme Toggle ---
  (function initTheme() {
    const toggle = document.querySelector('[data-theme-toggle]');
    const root = document.documentElement;
    let theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.setAttribute('data-theme', theme);
    updateToggleIcon(toggle, theme);

    toggle && toggle.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      updateToggleIcon(toggle, theme);
    });
  })();

  function updateToggleIcon(btn, theme) {
    if (!btn) return;
    btn.setAttribute('aria-label', 'Wissel naar ' + (theme === 'dark' ? 'licht' : 'donker') + ' thema');
    btn.innerHTML = theme === 'dark'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  // --- Mobile Search Toggle ---
  document.getElementById('mobileSearchToggle')?.addEventListener('click', () => {
    document.getElementById('headerSearch')?.classList.toggle('mobile-open');
  });

  // --- Data Loading ---
  async function loadLetterData(letter) {
    const key = letter.toUpperCase();
    if (state.wordCache[key]) return state.wordCache[key];
    if (state.loadingLetters[key]) return state.loadingLetters[key];

    state.loadingLetters[key] = fetch(`./data/${letter.toLowerCase()}.json`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(words => {
        state.wordCache[key] = words;
        state.letterCounts[key] = words.length;
        delete state.loadingLetters[key];
        return words;
      })
      .catch(() => {
        delete state.loadingLetters[key];
        return [];
      });

    return state.loadingLetters[key];
  }

  async function loadIndex() {
    try {
      const r = await fetch('./data/index.json');
      state.letterCounts = await r.json();
    } catch(e) {
      console.warn('Could not load index');
    }
  }

  // --- Router ---
  function getRoute() {
    const hash = location.hash.slice(1) || '/';
    const parts = hash.split('/').filter(Boolean);

    if (parts.length === 0 || hash === '/') return { page: 'home' };
    if (parts[0] === 'letter' && parts[1]) return { page: 'letter', letter: parts[1].toUpperCase() };
    if (parts[0] === 'woord' && parts[1]) return { page: 'word', word: decodeURIComponent(parts[1]) };
    if (parts[0] === 'zoek' && parts[1]) return { page: 'search', query: decodeURIComponent(parts[1]) };
    if (parts[0] === 'over') return { page: 'about' };
    return { page: 'home' };
  }

  async function navigate() {
    const route = getRoute();
    app.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Laden...</div>';

    switch(route.page) {
      case 'home': renderHome(); break;
      case 'letter': await renderLetter(route.letter); break;
      case 'word': await renderWord(route.word); break;
      case 'search': await renderSearch(route.query); break;
      case 'about': renderAbout(); break;
      default: renderHome();
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
    updateDocumentMeta(route);
  }

  function updateDocumentMeta(route) {
    let title = 'Woordenboek.org — Nederlands Woordenboek';
    let desc = 'Gratis online Nederlands woordenboek met meer dan 400.000 woorden.';

    switch(route.page) {
      case 'letter':
        title = `Woorden met ${route.letter} — Woordenboek.org`;
        desc = `Alle Nederlandse woorden die beginnen met de letter ${route.letter}. Blader door de woordenlijst.`;
        break;
      case 'word':
        title = `${route.word} — Betekenis & definitie — Woordenboek.org`;
        desc = `Wat betekent "${route.word}"? Zoek dit woord op in het Nederlands woordenboek.`;
        break;
      case 'search':
        title = `Zoeken: "${route.query}" — Woordenboek.org`;
        desc = `Zoekresultaten voor "${route.query}" in het Nederlands woordenboek.`;
        break;
      case 'about':
        title = 'Over Woordenboek.org — Nederlands Woordenboek';
        break;
    }

    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc);
  }

  // --- Render: Home ---
  function renderHome() {
    const wotd = getWordOfTheDay();

    app.innerHTML = `
      <div class="page-content">
        <section class="hero">
          <h1 class="hero-title">Nederlands Woordenboek</h1>
          <p class="hero-subtitle">Meer dan 400.000 woorden doorzoekbaar. Gebaseerd op de OpenTaal woordenlijst.</p>
          <div class="hero-search">
            <svg class="hero-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="search" class="hero-search-input" id="heroSearchInput" placeholder="Typ een woord om te zoeken..." autocomplete="off" spellcheck="false" autofocus>
            <div class="hero-search-results search-results-dropdown" id="heroSearchResults"></div>
          </div>
        </section>

        <section class="wotd-card">
          <div class="wotd-label">Woord van de dag</div>
          <div class="wotd-word"><a href="#/woord/${encodeURIComponent(wotd)}">${escapeHtml(wotd)}</a></div>
        </section>

        <section>
          <h2 class="letter-heading" style="margin-bottom:var(--space-6)">Blader op letter</h2>
          <div class="letter-grid" id="letterGrid"></div>
        </section>

        <section class="info-grid">
          <div class="info-card">
            <svg class="info-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
            <h3>400.000+ woorden</h3>
            <p>De meest uitgebreide gratis Nederlandse woordenlijst, van de OpenTaal stichting.</p>
          </div>
          <div class="info-card">
            <svg class="info-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            <h3>Direct zoeken</h3>
            <p>Typ en vind direct woorden met onze snelle zoekfunctie. Resultaten verschijnen terwijl u typt.</p>
          </div>
          <div class="info-card">
            <svg class="info-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"/></svg>
            <h3>Open bron</h3>
            <p>Gebaseerd op de OpenTaal woordenlijst, vrij beschikbaar onder BSD/CC-BY licentie.</p>
          </div>
        </section>
      </div>
    `;

    // Set up hero search
    setupSearch('heroSearchInput', 'heroSearchResults', true);

    // Load letter grid
    loadIndex().then(() => renderLetterGrid());
  }

  function renderLetterGrid() {
    const grid = document.getElementById('letterGrid');
    if (!grid) return;

    grid.innerHTML = LETTERS.map(l => {
      const count = state.letterCounts[l] || '...';
      const formatted = typeof count === 'number' ? count.toLocaleString('nl-NL') : count;
      return `<a href="#/letter/${l.toLowerCase()}" class="letter-grid-item">
        <span class="letter-grid-char">${l}</span>
        <span class="letter-grid-count">${formatted} woorden</span>
      </a>`;
    }).join('');
  }

  // --- Render: Letter page ---
  async function renderLetter(letter) {
    const L = letter.toUpperCase();
    if (!LETTERS.includes(L)) { renderHome(); return; }

    const words = await loadLetterData(L);
    const pageParam = new URLSearchParams(location.hash.split('?')[1] || '');
    const page = parseInt(pageParam.get('p')) || 1;
    const total = words.length;
    const totalPages = Math.ceil(total / state.wordsPerPage);
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage - 1) * state.wordsPerPage;
    const end = Math.min(start + state.wordsPerPage, total);
    const pageWords = words.slice(start, end);

    app.innerHTML = `
      <div class="page-content">
        <nav class="alphabet-nav">${LETTERS.map(l =>
          `<a href="#/letter/${l.toLowerCase()}" class="alphabet-link${l === L ? ' active' : ''}">${l}</a>`
        ).join('')}</nav>

        <div class="letter-heading">
          <span>${L}</span>
          <span class="letter-count">${total.toLocaleString('nl-NL')} woorden</span>
        </div>

        <div class="word-columns" id="wordColumns">
          ${pageWords.map(w => `<a href="#/woord/${encodeURIComponent(w)}" class="word-link">${escapeHtml(w)}</a>`).join('')}
        </div>

        ${totalPages > 1 ? `
        <div class="pagination">
          <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="navigateLetterPage('${L}', ${currentPage - 1})">← Vorige</button>
          <span class="pagination-info">Pagina ${currentPage} van ${totalPages}</span>
          <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="navigateLetterPage('${L}', ${currentPage + 1})">Volgende →</button>
        </div>` : ''}
      </div>
    `;
  }

  // Global function for pagination
  window.navigateLetterPage = function(letter, page) {
    location.hash = `/letter/${letter.toLowerCase()}?p=${page}`;
  };

  // --- Render: Word page ---
  async function renderWord(word) {
    const firstChar = word[0]?.toUpperCase();
    const letterKey = LETTERS.includes(firstChar) ? firstChar : 'A';
    const words = await loadLetterData(letterKey);

    // Find exact match (case-insensitive)
    const idx = words.findIndex(w => w.toLowerCase() === word.toLowerCase());
    const found = idx !== -1;
    const displayWord = found ? words[idx] : word;

    // Get neighboring words for navigation
    const prevWord = idx > 0 ? words[idx - 1] : null;
    const nextWord = idx < words.length - 1 ? words[idx + 1] : null;

    // Find related words (same prefix)
    const prefix = displayWord.toLowerCase().slice(0, Math.min(4, displayWord.length));
    const related = words
      .filter(w => w.toLowerCase().startsWith(prefix) && w.toLowerCase() !== displayWord.toLowerCase())
      .slice(0, 15);

    // Word properties
    const charCount = displayWord.replace(/\s/g, '').length;
    const syllableEstimate = estimateSyllables(displayWord);
    const hasHyphen = displayWord.includes('-');
    const hasSpace = displayWord.includes(' ');

    // JSON-LD for the word
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "DefinedTerm",
      "name": displayWord,
      "inDefinedTermSet": {
        "@type": "DefinedTermSet",
        "name": "Nederlands Woordenboek",
        "url": "https://woordenboek.org"
      },
      "inLanguage": "nl",
      "creator": {
        "@type": "SoftwareApplication",
        "name": "Perplexity Computer",
        "url": "https://www.perplexity.ai/computer"
      }
    };

    app.innerHTML = `
      <div class="page-content word-page">
        <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>

        <nav class="breadcrumb">
          <a href="#/">Start</a>
          <span class="breadcrumb-sep">›</span>
          <a href="#/letter/${letterKey.toLowerCase()}">${letterKey}</a>
          <span class="breadcrumb-sep">›</span>
          <span>${escapeHtml(displayWord)}</span>
        </nav>

        ${!found ? `<div class="word-info-card" style="background:var(--color-accent-light);border-color:var(--color-accent);margin-bottom:var(--space-4)">
          <p style="font-size:var(--text-sm);color:var(--color-accent)">Dit woord is niet gevonden in de woordenlijst.</p>
        </div>` : ''}

        <h1 class="word-heading">${escapeHtml(displayWord)}</h1>

        <div class="word-info-card">
          <div class="word-info-row">
            <span class="word-info-label">Letters</span>
            <span class="word-info-value">${charCount}</span>
          </div>
          <div class="word-info-row">
            <span class="word-info-label">Lettergrepen</span>
            <span class="word-info-value">±${syllableEstimate}</span>
          </div>
          ${hasHyphen ? `<div class="word-info-row">
            <span class="word-info-label">Type</span>
            <span class="word-info-value">Samengesteld woord (met koppelteken)</span>
          </div>` : ''}
          ${hasSpace ? `<div class="word-info-row">
            <span class="word-info-label">Type</span>
            <span class="word-info-value">Meerdere woorden</span>
          </div>` : ''}
          <div class="word-info-row">
            <span class="word-info-label">Begint met</span>
            <span class="word-info-value"><a href="#/letter/${letterKey.toLowerCase()}" style="color:var(--color-primary);text-decoration:none">${letterKey}</a></span>
          </div>
          <div class="word-info-row">
            <span class="word-info-label">Bron</span>
            <span class="word-info-value"><a href="https://github.com/OpenTaal/opentaal-wordlist" target="_blank" rel="noopener noreferrer" style="color:var(--color-primary);text-decoration:none">OpenTaal</a></span>
          </div>
        </div>

        ${related.length > 0 ? `
        <section class="related-section">
          <h2 class="related-title">Verwante woorden</h2>
          <div class="related-words">
            ${related.map(w => `<a href="#/woord/${encodeURIComponent(w)}" class="related-tag">${escapeHtml(w)}</a>`).join('')}
          </div>
        </section>` : ''}

        <nav class="word-nav">
          ${prevWord ? `<a href="#/woord/${encodeURIComponent(prevWord)}">← ${escapeHtml(prevWord)}</a>` : '<span></span>'}
          ${nextWord ? `<a href="#/woord/${encodeURIComponent(nextWord)}">${escapeHtml(nextWord)} →</a>` : '<span></span>'}
        </nav>
      </div>
    `;
  }

  // --- Render: Search results ---
  async function renderSearch(query) {
    const q = query.toLowerCase().trim();
    if (!q) { renderHome(); return; }

    // Determine which letters to search
    const firstChar = q[0].toUpperCase();
    const searchLetters = LETTERS.includes(firstChar) ? [firstChar] : LETTERS;

    let results = [];
    for (const L of searchLetters) {
      const words = await loadLetterData(L);
      const matches = words.filter(w => w.toLowerCase().includes(q));
      results = results.concat(matches);
      if (results.length >= 200) break;
    }

    // Sort: exact match first, then starts-with, then contains
    results.sort((a, b) => {
      const al = a.toLowerCase(), bl = b.toLowerCase();
      if (al === q && bl !== q) return -1;
      if (bl === q && al !== q) return 1;
      if (al.startsWith(q) && !bl.startsWith(q)) return -1;
      if (bl.startsWith(q) && !al.startsWith(q)) return 1;
      return al.localeCompare(bl, 'nl');
    });

    app.innerHTML = `
      <div class="page-content">
        <nav class="breadcrumb">
          <a href="#/">Start</a>
          <span class="breadcrumb-sep">›</span>
          <span>Zoeken: "${escapeHtml(query)}"</span>
        </nav>

        <div class="letter-heading">
          <span>Zoekresultaten</span>
          <span class="letter-count">${results.length}${results.length >= 200 ? '+' : ''} resultaten voor "${escapeHtml(query)}"</span>
        </div>

        ${results.length > 0 ? `
        <div class="word-columns">
          ${results.slice(0, 200).map(w => {
            const highlighted = highlightMatch(w, query);
            return `<a href="#/woord/${encodeURIComponent(w)}" class="word-link">${highlighted}</a>`;
          }).join('')}
        </div>` : `
        <div class="loading" style="flex-direction:column;gap:var(--space-3)">
          <p>Geen resultaten gevonden voor "<strong>${escapeHtml(query)}</strong>"</p>
          <p style="color:var(--color-text-faint)">Controleer de spelling en probeer opnieuw.</p>
        </div>`}
      </div>
    `;
  }

  // --- Render: About ---
  function renderAbout() {
    app.innerHTML = `
      <div class="page-content word-page">
        <nav class="breadcrumb">
          <a href="#/">Start</a>
          <span class="breadcrumb-sep">›</span>
          <span>Over dit woordenboek</span>
        </nav>

        <h1 class="word-heading" style="font-size:var(--text-xl)">Over Woordenboek.org</h1>

        <div class="word-info-card" style="margin-bottom:var(--space-6)">
          <p style="margin-bottom:var(--space-4)">Woordenboek.org is een gratis, open-source Nederlands woordenboek met meer dan <strong>400.000 woorden</strong>. De woordenlijst is afkomstig van de <a href="https://www.opentaal.org/" target="_blank" rel="noopener noreferrer" style="color:var(--color-primary)">OpenTaal stichting</a>, die zich inzet voor vrij beschikbare Nederlandse taaltools.</p>
          <p style="margin-bottom:var(--space-4)">De woordenlijst bevat basiswoorden, vervoegingen, samenstellingen en eigennamen uit de Nederlandse taal, inclusief woorden uit België en Suriname.</p>
          <p style="margin-bottom:var(--space-4)"><strong>Broncode woordenlijst:</strong> <a href="https://github.com/OpenTaal/opentaal-wordlist" target="_blank" rel="noopener noreferrer" style="color:var(--color-primary)">github.com/OpenTaal/opentaal-wordlist</a></p>
          <p><strong>Licentie:</strong> BSD (software) en CC-BY (data)</p>
        </div>

        <h2 style="font-family:var(--font-display);font-size:var(--text-lg);margin-bottom:var(--space-4)">Statistieken</h2>
        <div class="word-info-card">
          <div class="word-info-row">
            <span class="word-info-label">Totaal woorden</span>
            <span class="word-info-value">${state.totalWords.toLocaleString('nl-NL')}</span>
          </div>
          <div class="word-info-row">
            <span class="word-info-label">Letters</span>
            <span class="word-info-value">A t/m Z (26 categorieën)</span>
          </div>
          <div class="word-info-row">
            <span class="word-info-label">Taal</span>
            <span class="word-info-value">Nederlands (NL, BE, SR)</span>
          </div>
          <div class="word-info-row">
            <span class="word-info-label">Bron</span>
            <span class="word-info-value">OpenTaal v2.x</span>
          </div>
        </div>
      </div>
    `;
  }

  // --- Search Functionality ---
  function setupSearch(inputId, resultsId, isHero) {
    const input = document.getElementById(inputId);
    const results = document.getElementById(resultsId);
    if (!input || !results) return;

    let debounceTimer;
    let highlightedIndex = -1;
    let currentResults = [];

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => performSearch(input, results, isHero), 150);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && currentResults[highlightedIndex]) {
          location.hash = `/woord/${encodeURIComponent(currentResults[highlightedIndex])}`;
          results.classList.remove('active');
        } else if (input.value.trim()) {
          location.hash = `/zoek/${encodeURIComponent(input.value.trim())}`;
          results.classList.remove('active');
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlightedIndex = Math.min(highlightedIndex + 1, currentResults.length - 1);
        updateHighlight(results, highlightedIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightedIndex = Math.max(highlightedIndex - 1, -1);
        updateHighlight(results, highlightedIndex);
      } else if (e.key === 'Escape') {
        results.classList.remove('active');
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !results.contains(e.target)) {
        results.classList.remove('active');
      }
    });

    async function performSearch(input, results, isHero) {
      const query = input.value.trim().toLowerCase();
      if (query.length < 2) {
        results.classList.remove('active');
        currentResults = [];
        return;
      }

      // Load the relevant letter data
      const firstChar = query[0].toUpperCase();
      if (LETTERS.includes(firstChar)) {
        const words = await loadLetterData(firstChar);
        const matches = words.filter(w => w.toLowerCase().startsWith(query)).slice(0, 10);
        const containsMatches = query.length >= 3
          ? words.filter(w => !w.toLowerCase().startsWith(query) && w.toLowerCase().includes(query)).slice(0, 5)
          : [];

        currentResults = [...matches, ...containsMatches];
        highlightedIndex = -1;

        if (currentResults.length > 0) {
          results.innerHTML = currentResults.map((w, i) =>
            `<div class="search-result-item" data-idx="${i}" onclick="location.hash='/woord/${encodeURIComponent(w)}';this.parentElement.classList.remove('active')">${highlightMatch(w, query)}</div>`
          ).join('') + `<div class="search-result-count">${words.filter(w => w.toLowerCase().includes(query)).length} resultaten — <a href="#/zoek/${encodeURIComponent(query)}" style="color:var(--color-primary)">Toon alles</a></div>`;
          results.classList.add('active');
        } else {
          results.innerHTML = '<div class="search-result-count">Geen resultaten gevonden</div>';
          results.classList.add('active');
        }
      }
    }

    function updateHighlight(container, idx) {
      container.querySelectorAll('.search-result-item').forEach((el, i) => {
        el.classList.toggle('highlighted', i === idx);
      });
    }
  }

  // Also setup header search
  setupSearch('headerSearchInput', 'headerSearchResults', false);

  // --- Utility Functions ---
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function highlightMatch(word, query) {
    const idx = word.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return escapeHtml(word);
    const before = word.slice(0, idx);
    const match = word.slice(idx, idx + query.length);
    const after = word.slice(idx + query.length);
    return escapeHtml(before) + '<mark>' + escapeHtml(match) + '</mark>' + escapeHtml(after);
  }

  function estimateSyllables(word) {
    // Simple Dutch syllable estimator
    const clean = word.toLowerCase().replace(/[^a-zàáâãäåæçèéêëìíîïðñòóôõöùúûüýÿ]/g, '');
    if (clean.length <= 3) return 1;
    // Count vowel groups
    const vowels = clean.match(/[aeiouàáâãäåæèéêëìíîïòóôõöùúûüýÿ]+/g);
    return vowels ? Math.max(1, vowels.length) : 1;
  }

  function getWordOfTheDay() {
    // Deterministic "random" word based on date
    const commonWords = [
      'avontuur', 'bibliotheek', 'chocolade', 'diamant', 'erfgoed',
      'fietspad', 'gezellig', 'horizon', 'ijskonijn', 'juweeltje',
      'koningshuis', 'lentebries', 'middernacht', 'nachtvlinder', 'ondernemer',
      'pindakaas', 'regenboog', 'schilderij', 'tulpenbol', 'uitvinding',
      'vliegtuig', 'windmolen', 'zandkasteel', 'boekenplank', 'droomwereld',
      'fietsbel', 'huiskamer', 'koffiezetapparaat', 'strandwandeling', 'zonsondergang',
      'waterval', 'paddenstoel'
    ];
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    return commonWords[dayOfYear % commonWords.length];
  }

  // --- Init ---
  window.addEventListener('hashchange', navigate);
  loadIndex().then(() => navigate());

})();
