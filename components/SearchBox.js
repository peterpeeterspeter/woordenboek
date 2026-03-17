'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBox({ isHero = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [letterCache, setLetterCache] = useState({});
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const router = useRouter();
  const timerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  async function loadLetter(l) {
    if (letterCache[l]) return letterCache[l];
    try {
      // Fetch word list from API route
      const res = await fetch(`/api/words/${l}`);
      if (!res.ok) return [];
      const words = await res.json();
      setLetterCache((prev) => ({ ...prev, [l]: words }));
      return words;
    } catch {
      return [];
    }
  }

  async function search(q) {
    if (q.length < 2) { setResults([]); setOpen(false); return; }

    const firstChar = q[0].toLowerCase();
    const isLetter = /[a-z]/.test(firstChar);
    if (!isLetter) return;

    const words = await loadLetter(firstChar);
    const starts = words.filter((w) => w.toLowerCase().startsWith(q)).slice(0, 8);
    const contains = q.length >= 3
      ? words.filter((w) => !w.toLowerCase().startsWith(q) && w.toLowerCase().includes(q)).slice(0, 4)
      : [];
    const combined = [...starts, ...contains];
    setResults(combined);
    setHighlighted(-1);
    setOpen(combined.length > 0);
  }

  function handleInput(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val.trim().toLowerCase()), 150);
  }

  function go(word) {
    setOpen(false);
    setQuery('');
    router.push(`/betekenis/${encodeURIComponent(word)}`);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0 && results[highlighted]) {
        go(results[highlighted]);
      } else if (query.trim()) {
        setOpen(false);
        router.push(`/zoek/${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function highlight(word, q) {
    const idx = word.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return word;
    return (
      <>
        {word.slice(0, idx)}
        <mark>{word.slice(idx, idx + q.length)}</mark>
        {word.slice(idx + q.length)}
      </>
    );
  }

  const cls = isHero ? 'hero-search' : 'search-container';
  const inputCls = isHero ? 'hero-search-input' : 'search-input';
  const dropCls = isHero ? 'hero-search-results search-results-dropdown' : 'search-results-dropdown';

  return (
    <div className={cls} ref={wrapRef} style={isHero ? undefined : { position: 'relative' }}>
      {isHero && (
        <svg className="hero-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      )}
      <input
        ref={inputRef}
        type="search"
        className={inputCls}
        placeholder="Typ een woord om te zoeken..."
        autoComplete="off"
        spellCheck="false"
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && (
        <div className={`${dropCls} active`}>
          {results.map((w, i) => (
            <div
              key={w}
              className={`search-result-item${i === highlighted ? ' highlighted' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); go(w); }}
            >
              {highlight(w, query)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
